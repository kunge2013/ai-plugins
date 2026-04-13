/**
 * Anthropic service implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import { LLMService, LLMMessage } from './LLMService';
import { AnthropicSettings } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('AnthropicService');

export class AnthropicService implements LLMService {
    private client: Anthropic;
    private settings: AnthropicSettings;
    private lastError: string | null = null;

    constructor(settings: AnthropicSettings) {
        this.settings = settings;
        this.client = new Anthropic({
            apiKey: this.settings.apiKey,
            dangerouslyAllowBrowser: true,
        });
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

    async *streamResponse(messages: LLMMessage[]): AsyncGenerator<string> {
        this.lastError = null;

        if (!this.validateSettings()) {
            throw new Error(this.lastError || 'Invalid settings');
        }

        try {
            // Anthropic requires first message to be user
            // Convert our format to Anthropic format
            const anthropicMessages = messages
                .filter(msg => msg.role !== 'system' || msg.content.trim())
                .map(msg => ({
                    role: msg.role === 'system' ? 'user' as const : msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
                    content: msg.content,
                }));

            // Extract system message from messages
            const systemMessage = messages.find(msg => msg.role === 'system')?.content;

            const stream = await this.client.messages.create({
                model: this.settings.model,
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                messages: anthropicMessages,
                ...(systemMessage ? { system: systemMessage } : {}),
                stream: true,
            });

            for await (const event of stream as unknown as AsyncIterable<MessageStreamEvent>) {
                if (event.type === 'content_block_delta') {
                    if (event.delta.type === 'text_delta') {
                        yield event.delta.text;
                    }
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.lastError = `Anthropic API 错误: ${errorMsg}`;
            logger.error(this.lastError, error);
            throw new Error(this.lastError);
        }
    }
}
