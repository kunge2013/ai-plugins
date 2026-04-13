/**
 * Plugin settings definition and default values
 */

export type LLMProvider = 'openai' | 'anthropic' | 'local';

export interface OpenAISettings {
    apiKey: string;
    model: string;
    baseUrl: string;
    maxTokens: number;
    temperature: number;
}

export interface AnthropicSettings {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

export interface LocalSettings {
    baseUrl: string;
    model: string;
    maxTokens: number;
    temperature: number;
}

export interface UISettings {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    maxWidth: number;
    showTimestamp: boolean;
    autoScroll: boolean;
}

export interface LLMPluginSettings {
    defaultProvider: LLMProvider;
    openai: OpenAISettings;
    anthropic: AnthropicSettings;
    local: LocalSettings;
    ui: UISettings;
    systemPrompt: string;
}

export const DEFAULT_SETTINGS: LLMPluginSettings = {
    defaultProvider: 'openai',
    openai: {
        apiKey: '',
        model: 'gpt-4o',
        baseUrl: 'https://api.openai.com/v1',
        maxTokens: 4096,
        temperature: 0.7,
    },
    anthropic: {
        apiKey: '',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 4096,
        temperature: 0.7,
    },
    local: {
        baseUrl: 'http://localhost:11434',
        model: 'llama3.1',
        maxTokens: 4096,
        temperature: 0.7,
    },
    ui: {
        theme: 'auto',
        fontSize: 14,
        maxWidth: 800,
        showTimestamp: true,
        autoScroll: true,
    },
    systemPrompt: 'You are a helpful assistant. Provide clear and concise answers.',
};
