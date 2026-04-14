/**
 * OpenAI service implementation
 * Uses Obsidian-native request to bypass CORS restrictions
 */

import { LLMService, LLMMessage } from './LLMService';
import { OpenAISettings } from '../core/PluginSettings';
import { ObsidianRequestLLMService } from './ObsidianRequestLLMService';

export class OpenAIService extends ObsidianRequestLLMService implements LLMService {
    constructor(settings: OpenAISettings) {
        super(settings);
    }
}
