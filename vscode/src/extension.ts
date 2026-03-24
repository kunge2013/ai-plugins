import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface WebviewMessage {
  command: string;
  text?: string;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    'translation.translate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('没有活动的编辑器');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText.trim()) {
        vscode.window.showWarningMessage('没有选中任何文本');
        return;
      }

      // Get configuration
      const config = vscode.workspace.getConfiguration('translation');
      const promptTemplate = config.get<string>('promptTemplate') || '请将{xx}翻译成为中文';
      const externalLinkName = config.get<string>('externalLinkName') || '';
      const externalLinkUrl = config.get<string>('externalLinkUrl') || '';
      const externalLinkParam = config.get<string>('externalLinkParam') || 'prompt';

      // Replace placeholder
      const formattedPrompt = promptTemplate.replace(/{xx}/g, selectedText);

      // Create webview panel
      const panel = vscode.window.createWebviewPanel(
        'translationPrompt',
        '翻译提示',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      // Load HTML template
      const htmlPath = path.join(context.extensionPath, 'media', 'webview.html');
      let htmlContent: string;
      try {
        // Use synchronous read for reliability
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
      } catch (error) {
        vscode.window.showErrorMessage(`无法加载HTML模板: ${(error as Error).message}`);
        return;
      }

      // Replace placeholders
      htmlContent = htmlContent.replace(/{{prompt}}/g, escapeHtml(formattedPrompt));

      // Build external link if configured
      let externalLinkHtml = '';
      if (externalLinkName && externalLinkUrl) {
        externalLinkHtml = `<button id="openLinkBtn">${escapeHtml(externalLinkName)}</button>`;
      }
      htmlContent = htmlContent.replace('{{externalLinkHtml}}', externalLinkHtml);

      // Set the HTML content
      panel.webview.html = htmlContent;

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
          switch (message.command) {
            case 'copy':
              await vscode.env.clipboard.writeText(formattedPrompt);
              vscode.window.showInformationMessage('提示词已复制到剪贴板');
              break;
            case 'openLink':
              if (externalLinkName && externalLinkUrl) {
                const encodedPrompt = encodeURIComponent(formattedPrompt);
                const separator = externalLinkUrl.includes('?') ? '&' : '?';
                const fullUrl = `${externalLinkUrl}${separator}${externalLinkParam}=${encodedPrompt}`;
                vscode.env.openExternal(vscode.Uri.parse(fullUrl));
              }
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function deactivate() {}
