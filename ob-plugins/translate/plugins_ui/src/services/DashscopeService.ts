/**
 * Alibaba Cloud Dashscope (Qwen) service implementation
 * Uses OpenAI-compatible API with Obsidian request to bypass CORS
 */

import { LLMService, LLMMessage } from './LLMService';
import { DashscopeSettings } from '../core/PluginSettings';
import { ObsidianRequestLLMService, OpenAICompatibleSettings } from './ObsidianRequestLLMService';

// Convert DashscopeSettings to OpenAICompatibleSettings
class DashscopeAdapter implements OpenAICompatibleSettings {
    private settings: DashscopeSettings;

    constructor(settings: DashscopeSettings) {
        this.settings = settings;
    }

    get apiKey(): string { return this.settings.apiKey; }
    get model(): string { return this.settings.model; }
    get baseUrl(): string { return 'https://dashscope.aliyuncs.com/compatible-mode/v1'; }
    get maxTokens(): number { return this.settings.maxTokens; }
    get temperature(): number { return this.settings.temperature; }
}

export class DashscopeService extends ObsidianRequestLLMService implements LLMService {
    constructor(settings: DashscopeSettings) {
        super(new DashscopeAdapter(settings));
    }
}
