/**
 * Main plugin class
 */

import { Plugin, Editor, Notice, EditorMenu, MarkdownView } from 'obsidian';
import { LLMPluginSettings, DEFAULT_SETTINGS, LLMProvider } from './PluginSettings';
import { LLMPluginSettingTab } from '../ui/SettingsTab';
import { LLMModal } from '../ui/LLMModal';
import { LLMService } from '../services/LLMService';
import { OpenAIService } from '../services/OpenAIService';
import { AnthropicService } from '../services/AnthropicService';
import { LocalService } from '../services/LocalService';
import { createLogger } from '../utils/logger';

const logger = createLogger('PluginMain');

export class LLMContextMenuPlugin extends Plugin {
    settings: LLMPluginSettings;

    async onload(): Promise<void> {
        logger.info('Loading plugin...');
        await this.loadSettings();
        this.registerContextMenu();
        this.registerCommands();
        this.addSettingTab(new LLMPluginSettingTab(this.app, this));
        logger.info('Plugin loaded');
    }

    async onunload(): Promise<void> {
        logger.info('Plugin unloaded');
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    private registerContextMenu(): void {
        // Register editor context menu item
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor, view) => {
                const selectedText = editor.getSelection();
                // Only show the menu item when there is selected text
                if (selectedText && selectedText.trim().length > 0) {
                    menu.addItem((item) => {
                        item
                            .setTitle('Ask LLM')
                            .setIcon('bot')
                            .onClick(() => {
                                this.handleAskLLM(selectedText, editor);
                            });
                    });
                }
            })
        );
    }

    private registerCommands(): void {
        this.addCommand({
            id: 'ask-llm-selection',
            name: 'Ask LLM about selection',
            hotkeys: [
                {
                    modifiers: ['Mod', 'Shift'],
                    key: 'l',
                },
            ],
            callback: () => {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (!editor) {
                    new Notice('No active editor');
                    return;
                }

                const selectedText = editor.getSelection();
                if (!selectedText || selectedText.trim().length === 0) {
                    new Notice('Please select some text first');
                    return;
                }

                this.handleAskLLM(selectedText, editor);
            },
        });

        this.addCommand({
            id: 'ask-llm-empty',
            name: 'Open LLM dialog',
            callback: () => {
                this.handleAskLLM('', null);
            },
        });
    }

    private getLLMService(): LLMService | null {
        const provider: LLMProvider = this.settings.defaultProvider;

        switch (provider) {
            case 'openai':
                return new OpenAIService(this.settings.openai);
            case 'anthropic':
                return new AnthropicService(this.settings.anthropic);
            case 'local':
                return new LocalService(this.settings.local);
            default:
                new Notice(`Unknown provider: ${provider}`);
                return null;
        }
    }

    private handleAskLLM(selectedText: string, editor: Editor | null): void {
        const service = this.getLLMService();
        if (!service) return;

        if (!service.validateSettings()) {
            const error = service.getLastError();
            new Notice(error || 'Invalid configuration, please check settings');
            return;
        }

        const modal = new LLMModal(this.app, {
            selectedText: selectedText || this.settings.systemPrompt,
            service: service,
            settings: this.settings,
            onInsert: editor ? (response) => {
                // Get current cursor position
                const cursor = editor.getCursor();
                // Insert the response after the selection
                editor.replaceRange('\n\n---\n' + response + '\n', {
                    line: cursor.line,
                    ch: 0,
                });
            } : undefined,
        });

        modal.open();
    }
}
