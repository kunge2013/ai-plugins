/**
 * OpenAI service implementation
 */

import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type { Stream } from 'openai/streaming';
import { LLMService, LLMMessage } from './LLMService';
import { OpenAISettings } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('OpenAIService');

export class OpenAIService implements LLMService {
    private client: OpenAI;
    private settings: OpenAISettings;
    private lastError: string | null = null;

    constructor(settings: OpenAISettings) {
        this.settings = settings;
        this.client = new OpenAI({
            apiKey: this.settings.apiKey,
            baseURL: this.settings.baseUrl || undefined,
            dangerouslyAllowBrowser: true,
        });
    }

    getLastError(): string | null {
        return this.lastError;
    }

    validateSettings(): boolean {
        if (!this.settings.apiKey || this.settings.apiKey.trim().length === 0) {
            this.lastError = 'OpenAI API Key 未配置';
            return false;
        }
        if (!this.settings.model || this.settings.model.trim().length === 0) {
            this.lastError = 'OpenAI Model 未配置';
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
            const stream: Stream<ChatCompletionChunk> = await this.client.chat.completions.create({
                model: this.settings.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                max_tokens: this.settings.maxTokens,
                temperature: this.settings.temperature,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.lastError = `OpenAI API 错误: ${errorMsg}`;
            logger.error(this.lastError, error);
            throw new Error(this.lastError);
        }
    }
}
