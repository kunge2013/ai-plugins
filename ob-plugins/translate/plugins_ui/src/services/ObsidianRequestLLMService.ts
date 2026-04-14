/**
 * Base LLM service using Obsidian request to bypass CORS
 * Works with OpenAI-compatible APIs (including Alibaba Cloud Dashscope)
 * Uses Obsidian's request API which bypasses CORS restrictions
 */

import { request } from 'obsidian';
import type { LLMService, LLMMessage } from './LLMService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ObsidianRequestLLMService');

export interface OpenAICompatibleSettings {
    apiKey: string;
    model: string;
    baseUrl: string;
    maxTokens: number;
    temperature: number;
}

export abstract class ObsidianRequestLLMService implements LLMService {
    protected settings: OpenAICompatibleSettings;
    private lastError: string | null = null;
    private isAborted: boolean = false;

    constructor(settings: OpenAICompatibleSettings) {
        this.settings = settings;
    }

    getLastError(): string | null {
        return this.lastError;
    }

    validateSettings(): boolean {
        if (!this.settings.apiKey || this.settings.apiKey.trim().length === 0) {
            this.lastError = 'API Key 未配置';
            return false;
        }
        if (!this.settings.model || this.settings.model.trim().length === 0) {
            this.lastError = 'Model 未配置';
            return false;
        }
        if (!this.settings.baseUrl || this.settings.baseUrl.trim().length === 0) {
            this.lastError = 'Base URL 未配置';
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
            // Ensure baseUrl ends properly and construct the full URL
            // Don't use new URL() which triggers browser CORS checking
            let baseUrl = this.settings.baseUrl;
            if (!baseUrl.endsWith('/')) {
                baseUrl += '/';
            }
            const url = baseUrl + 'chat/completions';

            const body = JSON.stringify({
                model: this.settings.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                stream: false,
            });

            logger.debug(`Streaming from ${url}`);

            // Use Obsidian request which bypasses CORS
            // Obsidian request doesn't support streaming directly, so we get full response
            // and then simulate streaming by parsing SSE
            let fullResponse: string;
            try {
                fullResponse = await request({
                    url: url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.settings.apiKey}`,
                    },
                    body: body,
                });
				
				console.log('fullResponse', fullResponse)
            } catch (requestError: any) {
                // If request has a response property with error details, try to extract it
                if (requestError && typeof requestError === 'object' && 'response' in requestError) {
                    try {
                        const errorResp = JSON.parse(requestError.response);
                        if (errorResp.error) {
                            const errorMsg = typeof errorResp.error === 'object'
                                ? errorResp.error.message || JSON.stringify(errorResp.error)
                                : JSON.stringify(errorResp);
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

            // Handle both streaming (SSE) and non-streaming response
            try {
                // First try non-streaming format
                const data = JSON.parse(fullResponse);
                const content = data.choices[0]?.message?.content;
                if (content) {
                    yield content;
                }
                return;
            } catch (e) {
                // If parsing fails, try streaming (SSE) format line by line
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
                        const content = data.choices[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        // Try to buffer incomplete JSON (may happen when split by newlines)
                        buffer += jsonLine;
                        try {
                            const data = JSON.parse(buffer);
                            const content = data.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                            buffer = '';
                        } catch (_) {
                            // Still incomplete - keep buffering
                        }
                        logger.warn('Failed to parse JSON line:', line);
                    }
                }

                if (buffer) {
                    try {
                        const data = JSON.parse(buffer);
                        const content = data.choices[0]?.delta?.content ?? data.choices[0]?.message?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (_) {
                        // ignore
                    }
                }
            }
        } catch (error) {
            if (this.isAborted) {
                this.lastError = '请求已取消';
            } else {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.lastError = `API 错误: ${errorMsg}`;
                logger.error(this.lastError, error);
            }
            throw new Error(this.lastError || 'Unknown error');
        } finally {
            this.isAborted = false;
        }
    }
}
