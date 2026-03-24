# VS Code 翻译插件

一个简单的 VS Code 插件，帮助你将选中的英文 Markdown 文本格式化为翻译提示词，方便复制到 ChatGPT、Claude 等大模型进行翻译。

## 功能

- 选中文本后，右键点击菜单中的「翻译」
- 自动根据配置的提示词模板格式化文本
- 在新标签页中展示格式化后的提示词
- 点击「复制到剪贴板」按钮即可复制
- 提示词模板可通过 VS Code 设置自定义配置

## 安装

1. 克隆此仓库
2. 安装依赖：
```bash
npm install
```

3. 编译：
```bash
npm run compile
```

4. 在 VS Code 中按 F5 启动扩展开发主机进行测试

## 打包安装

如果你想永久安装这个插件到你的 VS Code，可以打包成 `.vsix` 文件然后安装：

1. 安装打包工具：
```bash
npm install -g @vscode/vsce
```

2. 打包：
```bash
vsce package
```

这会生成 `vscode-translate-plugin-0.0.1.vsix` 文件。

3. 在 VS Code 中安装：
   - 打开 VS Code → 左侧「扩展」
   - 点击右上角 `...` → 选择「从 VSIX 安装...」
   - 选择生成的 `.vsix` 文件
   - 重启 VS Code 即可使用

## 配置

在 VS Code 设置中搜索「翻译」，你可以自定义提示词模板：

- `translation.promptTemplate`: 翻译提示词模板，使用 `{xx}` 作为选中文本的占位符。默认值：
```
请将{xx}翻译成为中文
```

你可以根据需要修改为其他提示词，例如：
```
请将以下英文markdown翻译为中文，保持原格式：
{xx}
```

### 外部链接配置（直接跳转大模型网站）

- `translation.externalLinkName`: 外部链接按钮名称，留空则不显示按钮。默认值：
```
DeepSeek 问答
```

- `translation.externalLinkUrl`: 外部链接 URL。默认值：
```
https://chat.deepseek.com/
```

- `translation.externalLinkParam`: URL 参数名称，提示词会作为参数值自动 URL 编码后拼接到 URL。默认值：
```
prompt
```

配置后会在面板中显示一个按钮，点击后会直接在浏览器打开对应网站并自动传递提示词参数。

## 使用方法

1. 在编辑器中选中需要翻译的英文文本
2. 右键点击，在上下文菜单中选择「翻译」
3. 会在新标签页打开翻译提示面板
4. 点击「复制到剪贴板」
5. 粘贴到 ChatGPT/Claude 等大模型中进行翻译

## 开发

- 监听模式自动编译：
```bash
npm run watch
```

- 按 F5 启动调试

## 许可证

MIT
