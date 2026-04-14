/**
 * LLM Response Modal with streaming
 */

import { App, Modal, MarkdownRenderer, Component } from 'obsidian';
import { LLMService, LLMMessage } from '../services/LLMService';
import { LLMPluginSettings } from '../core/PluginSettings';
import { createLogger } from '../utils/logger';

const logger = createLogger('LLMModal');

export interface LLMModalOptions {
    selectedText: string;
    service: LLMService;
    settings: LLMPluginSettings;
    onInsert?: (response: string) => void;
}

export class LLMModal extends Modal {
    private options: LLMModalOptions;
    private responseContainer: HTMLElement;
    private actionsContainer: HTMLElement;
    private statusContainer: HTMLElement;
    private fullResponse: string = '';
    private isStreaming: boolean = false;
    private component: Component;

    constructor(app: App, options: LLMModalOptions) {
        super(app);
        this.options = options;
        this.component = new Component();
    }

    onOpen(): void {
        this.renderUI();
        this.startStreaming();
    }

    onClose(): void {
        this.component.unload();
        this.isStreaming = false;
        // Abort any ongoing request
        if (this.options.service.abort) {
            this.options.service.abort();
        }
        this.fullResponse = '';
    }

    private renderUI(): void {
        const { selectedText, settings } = this.options;

        // Add custom classes
        this.modalEl.addClass('llm-modal');
        this.modalEl.style.setProperty('--llm-font-size', `${settings.ui.fontSize}px`);
        this.modalEl.style.setProperty('--llm-max-width', `${settings.ui.maxWidth}px`);

        // Header
        const headerEl = this.titleEl;
        headerEl.setText('LLM Response');

        // Create content container
        this.contentEl.empty();
        this.contentEl.addClass('llm-modal-content');

        // Selected text preview
        const previewEl = this.contentEl.createDiv({
            cls: 'llm-query-preview',
        });
        previewEl.createEl('h4', { text: 'Query:' });
        const previewContent = previewEl.createDiv({
            cls: 'llm-query-content',
        });
        previewContent.setText(selectedText.length > 200
            ? selectedText.slice(0, 200) + '...'
            : selectedText);

        // Divider
        this.contentEl.createEl('hr');

        // Response container
        this.responseContainer = this.contentEl.createDiv({
            cls: 'llm-response-container',
        });
        this.responseContainer.createEl('h4', { text: 'Response:' });
        const scrollContainer = this.responseContainer.createDiv({
            cls: 'llm-response-scroll',
        });
        this.responseContainer = scrollContainer;

        // Status container
        this.statusContainer = this.contentEl.createDiv({
            cls: 'llm-status',
        });
        this.setStatus('Thinking...');

        // Actions
        this.actionsContainer = this.contentEl.createDiv({
            cls: 'llm-actions',
        });

        this.addActionButtons();
    }

    private addActionButtons(): void {
        // Copy button
        const copyBtn = this.actionsContainer.createEl('button', {
            cls: 'mod-cta llm-btn',
            text: 'Copy',
        });
        copyBtn.addEventListener('click', () => this.copyResponse());

        // Insert button
        const insertBtn = this.actionsContainer.createEl('button', {
            cls: 'llm-btn',
            text: 'Insert',
        });
        insertBtn.addEventListener('click', () => this.insertResponse());

        // Close button
        const closeBtn = this.actionsContainer.createEl('button', {
            cls: 'llm-btn',
            text: 'Close',
        });
        closeBtn.addEventListener('click', () => this.close());
    }

    private setStatus(message: string): void {
        this.statusContainer.setText(message);
    }

    private async startStreaming(): Promise<void> {
        this.isStreaming = true;
        this.fullResponse = '';

        const { selectedText, service, settings } = this.options;

        // Prepare messages
        const messages: LLMMessage[] = [];

        // Add system prompt if configured
        if (settings.systemPrompt && settings.systemPrompt.trim()) {
            messages.push({
                role: 'system',
                content: settings.systemPrompt,
            });
        }

        // Add user query
        messages.push({
            role: 'user',
            content: selectedText,
        });

        try {
            for await (const chunk of service.streamResponse(messages)) {
                if (!this.isStreaming) break;

                this.fullResponse += chunk;
                this.updateResponseDisplay();

                if (settings.ui.autoScroll) {
                    this.scrollToBottom();
                }
            }

            this.isStreaming = false;
            this.setStatus('Response complete ✓');
        } catch (error) {
            this.isStreaming = false;
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.setStatus(`Error: ${errorMsg}`);
            this.fullResponse += `\n\n**Error**: ${errorMsg}`;
            this.updateResponseDisplay();
            logger.error('Streaming error:', error);
        }
    }

    private updateResponseDisplay(): void {
        this.responseContainer.empty();

        // Use Obsidian's built-in Markdown renderer
        MarkdownRenderer.renderMarkdown(
            this.fullResponse,
            this.responseContainer,
            '',
            this.component
        );
    }

    private scrollToBottom(): void {
        this.responseContainer.scrollTop = this.responseContainer.scrollHeight;
    }

    private async copyResponse(): Promise<void> {
        await navigator.clipboard.writeText(this.fullResponse);
        this.setStatus('Copied to clipboard');
    }

    private insertResponse(): void {
        if (this.options.onInsert) {
            this.options.onInsert(this.fullResponse);
        }
        this.close();
    }
}
