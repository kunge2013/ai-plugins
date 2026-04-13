/**
 * Plugin settings tab
 */

import { PluginSettingTab, Setting } from 'obsidian';
import { LLMPluginSettings, DEFAULT_SETTINGS, LLMProvider } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('SettingsTab');

export class LLMPluginSettingTab extends PluginSettingTab {
    private plugin: {
        settings: LLMPluginSettings;
        saveSettings: () => Promise<void>;
    };

    constructor(app: any, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'LLM Context Menu Settings' });

        // Default Provider
        const defaultProviderSetting = new Setting(containerEl);
        defaultProviderSetting
            .setName('Default Provider')
            .setDesc('Choose the default LLM provider to use');
        defaultProviderSetting.addDropdown(dropdown => {
            dropdown
                .addOption('openai', 'OpenAI')
                .addOption('anthropic', 'Anthropic')
                .addOption('local', 'Local (Ollama)')
                .setValue(this.plugin.settings.defaultProvider)
                .onChange(async (value: LLMProvider) => {
                    this.plugin.settings.defaultProvider = value;
                    await this.plugin.saveSettings();
                });
        });

        containerEl.createEl('h3', { text: 'OpenAI Settings' });

        // API Key
        const openaiApiKeySetting = new Setting(containerEl);
        openaiApiKeySetting
            .setName('API Key')
            .setDesc('OpenAI API Key, get from https://platform.openai.com/api-keys');
        openaiApiKeySetting.addText(text => {
            text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.openai.apiKey)
                .onChange(async (value: string) => {
                    this.plugin.settings.openai.apiKey = value.trim();
                    await this.plugin.saveSettings();
                });
            text.inputEl.type = 'password';
        });

        // Base URL
        const openaiBaseUrlSetting = new Setting(containerEl);
        openaiBaseUrlSetting
            .setName('Base URL')
            .setDesc('OpenAI API base URL, default is official endpoint, can be changed to proxy or other compatible endpoints');
        openaiBaseUrlSetting.addText(text => {
            text
                .setPlaceholder('https://api.openai.com/v1')
                .setValue(this.plugin.settings.openai.baseUrl)
                .onChange(async (value: string) => {
                    this.plugin.settings.openai.baseUrl = value.trim();
                    await this.plugin.saveSettings();
                });
        });

        // Model
        const openaiModelSetting = new Setting(containerEl);
        openaiModelSetting
            .setName('Model')
            .setDesc('Model name, e.g. gpt-4o, gpt-4-turbo, gpt-3.5-turbo');
        openaiModelSetting.addText(text => {
            text
                .setPlaceholder('gpt-4o')
                .setValue(this.plugin.settings.openai.model)
                .onChange(async (value: string) => {
                    this.plugin.settings.openai.model = value.trim();
                    await this.plugin.saveSettings();
                });
        });

        // Max Tokens
        const openaiMaxTokensSetting = new Setting(containerEl);
        openaiMaxTokensSetting
            .setName('Max Tokens')
            .setDesc('Maximum number of tokens in the response');
        openaiMaxTokensSetting.addSlider(slider => {
            slider
                .setLimits(256, 16384, 256)
                .setValue(this.plugin.settings.openai.maxTokens)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.openai.maxTokens = value;
                    await this.plugin.saveSettings();
                });
        });

        // Temperature
        const openaiTempSetting = new Setting(containerEl);
        openaiTempSetting
            .setName('Temperature')
            .setDesc('Generation temperature - higher = more creative, lower = more focused');
        openaiTempSetting.addSlider(slider => {
            slider
                .setLimits(0, 2, 0.1)
                .setValue(this.plugin.settings.openai.temperature)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.openai.temperature = value;
                    await this.plugin.saveSettings();
                });
        });

        containerEl.createEl('h3', { text: 'Anthropic Settings' });

        // API Key
        const anthropicApiKeySetting = new Setting(containerEl);
        anthropicApiKeySetting
            .setName('API Key')
            .setDesc('Anthropic API Key, get from https://console.anthropic.com/');
        anthropicApiKeySetting.addText(text => {
            text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.anthropic.apiKey)
                .onChange(async (value: string) => {
                    this.plugin.settings.anthropic.apiKey = value.trim();
                    await this.plugin.saveSettings();
                });
            text.inputEl.type = 'password';
        });

        // Model
        const anthropicModelSetting = new Setting(containerEl);
        anthropicModelSetting
            .setName('Model')
            .setDesc('Model name, e.g. claude-3-5-sonnet-20241022, claude-3-opus-20240229');
        anthropicModelSetting.addText(text => {
            text
                .setPlaceholder('claude-3-5-sonnet-20241022')
                .setValue(this.plugin.settings.anthropic.model)
                .onChange(async (value: string) => {
                    this.plugin.settings.anthropic.model = value.trim();
                    await this.plugin.saveSettings();
                });
        });

        // Max Tokens
        const anthropicMaxTokensSetting = new Setting(containerEl);
        anthropicMaxTokensSetting
            .setName('Max Tokens')
            .setDesc('Maximum number of tokens in the response');
        anthropicMaxTokensSetting.addSlider(slider => {
            slider
                .setLimits(256, 16384, 256)
                .setValue(this.plugin.settings.anthropic.maxTokens)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.anthropic.maxTokens = value;
                    await this.plugin.saveSettings();
                });
        });

        // Temperature
        const anthropicTempSetting = new Setting(containerEl);
        anthropicTempSetting
            .setName('Temperature')
            .setDesc('Generation temperature - higher = more creative, lower = more focused');
        anthropicTempSetting.addSlider(slider => {
            slider
                .setLimits(0, 2, 0.1)
                .setValue(this.plugin.settings.anthropic.temperature)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.anthropic.temperature = value;
                    await this.plugin.saveSettings();
                });
        });

        containerEl.createEl('h3', { text: 'Local (Ollama) Settings' });

        // Base URL
        const localBaseUrlSetting = new Setting(containerEl);
        localBaseUrlSetting
            .setName('Base URL')
            .setDesc('Local API URL, default for Ollama is http://localhost:11434');
        localBaseUrlSetting.addText(text => {
            text
                .setPlaceholder('http://localhost:11434')
                .setValue(this.plugin.settings.local.baseUrl)
                .onChange(async (value: string) => {
                    this.plugin.settings.local.baseUrl = value.trim();
                    await this.plugin.saveSettings();
                });
        });

        // Model
        const localModelSetting = new Setting(containerEl);
        localModelSetting
            .setName('Model')
            .setDesc('Model name, e.g. llama3.1, gemma, mistral');
        localModelSetting.addText(text => {
            text
                .setPlaceholder('llama3.1')
                .setValue(this.plugin.settings.local.model)
                .onChange(async (value: string) => {
                    this.plugin.settings.local.model = value.trim();
                    await this.plugin.saveSettings();
                });
        });

        // Max Tokens
        const localMaxTokensSetting = new Setting(containerEl);
        localMaxTokensSetting
            .setName('Max Tokens')
            .setDesc('Maximum number of tokens in the response');
        localMaxTokensSetting.addSlider(slider => {
            slider
                .setLimits(256, 16384, 256)
                .setValue(this.plugin.settings.local.maxTokens)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.local.maxTokens = value;
                    await this.plugin.saveSettings();
                });
        });

        // Temperature
        const localTempSetting = new Setting(containerEl);
        localTempSetting
            .setName('Temperature')
            .setDesc('Generation temperature - higher = more creative, lower = more focused');
        localTempSetting.addSlider(slider => {
            slider
                .setLimits(0, 2, 0.1)
                .setValue(this.plugin.settings.local.temperature)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.local.temperature = value;
                    await this.plugin.saveSettings();
                });
        });

        containerEl.createEl('h3', { text: 'UI Settings' });

        // Theme
        const themeSetting = new Setting(containerEl);
        themeSetting
            .setName('Theme')
            .setDesc('Choose theme mode for the modal');
        themeSetting.addDropdown(dropdown => {
            dropdown
                .addOption('auto', 'Follow Obsidian')
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .setValue(this.plugin.settings.ui.theme)
                .onChange(async (value: 'light' | 'dark' | 'auto') => {
                    this.plugin.settings.ui.theme = value;
                    await this.plugin.saveSettings();
                });
        });

        // Font Size
        const fontSizeSetting = new Setting(containerEl);
        fontSizeSetting
            .setName('Font Size')
            .setDesc('Font size in pixels for response area');
        fontSizeSetting.addSlider(slider => {
            slider
                .setLimits(12, 20, 1)
                .setValue(this.plugin.settings.ui.fontSize)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.ui.fontSize = value;
                    await this.plugin.saveSettings();
                });
        });

        // Max Width
        const maxWidthSetting = new Setting(containerEl);
        maxWidthSetting
            .setName('Max Width')
            .setDesc('Maximum modal width in pixels');
        maxWidthSetting.addSlider(slider => {
            slider
                .setLimits(400, 1200, 50)
                .setValue(this.plugin.settings.ui.maxWidth)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.plugin.settings.ui.maxWidth = value;
                    await this.plugin.saveSettings();
                });
        });

        // Auto Scroll
        const autoScrollSetting = new Setting(containerEl);
        autoScrollSetting
            .setName('Auto Scroll')
            .setDesc('Auto scroll to bottom when streaming response');
        autoScrollSetting.addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.ui.autoScroll)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.ui.autoScroll = value;
                    await this.plugin.saveSettings();
                });
        });

        // System Prompt
        const systemPromptSetting = new Setting(containerEl);
        systemPromptSetting
            .setName('System Prompt')
            .setDesc('Custom system prompt to guide LLM behavior');
        systemPromptSetting.addTextArea(textArea => {
            textArea
                .setPlaceholder('You are a helpful assistant. Provide clear and concise answers.')
                .setValue(this.plugin.settings.systemPrompt)
                .onChange(async (value: string) => {
                    this.plugin.settings.systemPrompt = value.trim();
                    await this.plugin.saveSettings();
                });
            textArea.inputEl.rows = 3;
        });

        // Reset to defaults
        const resetSetting = new Setting(containerEl);
        resetSetting
            .setName('Reset Settings')
            .setDesc('Restore all settings to default values');
        resetSetting.addButton(button => {
            button
                .setButtonText('Reset')
                .onClick(async () => {
                    this.plugin.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
                    await this.plugin.saveSettings();
                    this.display();
                });
        });
    }
}
