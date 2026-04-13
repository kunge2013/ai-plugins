/**
 * Local model service implementation (Ollama-compatible)
 */

import { LLMService, LLMMessage } from './LLMService';
import { LocalSettings } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('LocalService');

export class LocalService implements LLMService {
    private settings: LocalSettings;
    private lastError: string | null = null;
    private abortController: AbortController | null = null;

    constructor(settings: LocalSettings) {
        this.settings = settings;
    }

    getLastError(): string | null {
        return this.lastError;
    }

    validateSettings(): boolean {
        if (!this.settings.baseUrl || this.settings.baseUrl.trim().length === 0) {
            this.lastError = 'Local Base URL 未配置';
            return false;
        }
        if (!this.settings.model || this.settings.model.trim().length === 0) {
            this.lastError = 'Local Model 未配置';
            return false;
        }
        return true;
    }

    abort(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    async *streamResponse(messages: LLMMessage[]): AsyncGenerator<string> {
        this.lastError = null;
        this.abortController = new AbortController();

        if (!this.validateSettings()) {
            throw new Error(this.lastError || 'Invalid settings');
        }

        try {
            // Ollama-compatible endpoint
            const url = new URL('/api/chat', this.settings.baseUrl.endsWith('/')
                ? this.settings.baseUrl
                : `${this.settings.baseUrl}/`);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                    stream: true,
                    options: {
                        temperature: this.settings.temperature,
                        num_predict: this.settings.maxTokens,
                    },
                }),
                signal: this.abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process each line (Ollama sends one JSON per line)
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    try {
                        const data = JSON.parse(line);
                        if (data.message?.content) {
                            yield data.message.content;
                        }
                        if (data.done) {
                            return;
                        }
                    } catch (e) {
                        logger.warn('Failed to parse JSON from local model:', line);
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.lastError = '请求已取消';
            } else {
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.lastError = `Local API 错误: ${errorMsg}\n请检查本地模型服务是否正在运行`;
                logger.error(this.lastError, error);
            }
            throw new Error(this.lastError || 'Unknown error');
        } finally {
            this.abortController = null;
        }
    }
}
