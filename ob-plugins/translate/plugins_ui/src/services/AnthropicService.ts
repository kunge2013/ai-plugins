/**
 * Anthropic service implementation
 * Uses Obsidian request to bypass CORS restrictions
 */

import { request } from 'obsidian';
import { LLMService, LLMMessage } from './LLMService';
import { AnthropicSettings } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnthropicService');

export class AnthropicService implements LLMService {
    private settings: AnthropicSettings;
    private lastError: string | null = null;
    private isAborted: boolean = false;

    constructor(settings: AnthropicSettings) {
        this.settings = settings;
    }

    getLastError(): string | null {
        return this.lastError;
    }

    validateSettings(): boolean {
        if (!this.settings.apiKey || this.settings.apiKey.trim().length === 0) {
            this.lastError = 'Anthropic API Key 未配置';
            return false;
        }
        if (!this.settings.model || this.settings.model.trim().length === 0) {
            this.lastError = 'Anthropic Model 未配置';
            return false;
        }
        return true;
    }

    abort(): void {
        this.isAborted = true;
    }

    async *streamResponse(messages: LLMMessage[]): AsyncGenerator<string> {
        this.lastError = null;
        this.isAborted = false;

        if (!this.validateSettings()) {
            throw new Error(this.lastError || 'Invalid settings');
        }

        try {
            // Anthropic requires first message to be user
            // Convert our format to Anthropic format
            const anthropicMessages = messages
                .filter(msg => msg.role !== 'system' || msg.content.trim())
                .map(msg => ({
                    role: (msg.role === 'system' ? 'user' : msg.role === 'assistant' ? 'assistant' : 'user') as
                        | 'user'
                        | 'assistant',
                    content: msg.content,
                }));

            // Extract system message from messages
            const systemMessage = messages.find(msg => msg.role === 'system')?.content;

            const url = 'https://api.anthropic.com/v1/messages';

            const body = JSON.stringify({
                model: this.settings.model,
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                messages: anthropicMessages,
                ...(systemMessage ? { system: systemMessage } : {}),
                stream: true,
            });

            // Use Obsidian request which bypasses CORS
            let fullResponse: string;
            try {
                fullResponse = await request({
                    url: url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.settings.apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                    body: body,
                });
            } catch (requestError: any) {
                // If request has a response property with error details, try to extract it
                if (requestError && typeof requestError === 'object' && 'response' in requestError) {
                    try {
                        const errorResp = JSON.parse(requestError.response);
                        if (errorResp.error || errorResp.type) {
                            const errorMsg = errorResp.error?.message || JSON.stringify(errorResp);
                            throw new Error(`API 返回错误: ${errorMsg}`);
                        }
                    } catch (_) {
                        // If parsing fails, throw original error
                    }
                }
                throw requestError;
            }

            if (this.isAborted) {
                this.lastError = '请求已取消';
                throw new Error(this.lastError);
            }

            // fullResponse is the complete SSE response as text
            // Each line is: data: {...}
            const lines = fullResponse.split('\n');
            let buffer = '';

            for (const line of lines) {
                if (this.isAborted) break;

                if (line.trim() === '') continue;

                // Handle SSE format: "data: ..."
                let jsonLine = line;
                if (line.startsWith('data: ')) {
                    jsonLine = line.slice(6);
                }

                if (jsonLine === '[DONE]') {
                    return;
                }

                try {
                    const data = JSON.parse(jsonLine);
                    if (data.type === 'content_block_delta') {
                        if (data.delta.type === 'text_delta' && data.delta.text) {
                            yield data.delta.text;
                        }
                    }
                } catch (e) {
                    // Try to buffer incomplete JSON
                    buffer += jsonLine;
                    try {
                        const data = JSON.parse(buffer);
                        if (data.type === 'content_block_delta') {
                            if (data.delta.type === 'text_delta' && data.delta.text) {
                                yield data.delta.text;
                            }
                        }
                        buffer = '';
                    } catch (_) {
                        // Still incomplete
                    }
                    logger.warn('Failed to parse JSON line:', line);
                }
            }

            if (buffer) {
                try {
                    const data = JSON.parse(buffer);
                    if (data.type === 'content_block_delta') {
                        if (data.delta.type === 'text_delta' && data.delta.text) {
                            yield data.delta.text;
                        }
                    }
                } catch (_) {
                    // ignore
                }
            }
        } catch (error) {
            if (this.isAborted) {
                this.lastError = '请求已取消';
            } else {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.lastError = `Anthropic API 错误: ${errorMsg}`;
                logger.error(this.lastError, error);
            }
            throw new Error(this.lastError || 'Unknown error');
        } finally {
            this.isAborted = false;
        }
    }
}
