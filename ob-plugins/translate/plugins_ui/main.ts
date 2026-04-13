import { Plugin } from 'obsidian';
import { LLMContextMenuPlugin } from './src/core/PluginMain';

export default class LLMContextMenuPluginWrapper extends Plugin {
    private plugin: LLMContextMenuPlugin;

    async onload(): Promise<void> {
        this.plugin = new LLMContextMenuPlugin(this.app, this.manifest);
        await this.plugin.onload();
    }

    async onunload(): Promise<void> {
        await this.plugin.onunload();
    }
}
