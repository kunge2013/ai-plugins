# VS Code 翻译插件 - 开发总结

## 项目概述

这是一个 VS Code 扩展插件，功能：
- 选中英文 Markdown 文本 → 右键菜单点击「翻译」
- 根据配置的提示词模板格式化文本
- 在 VS Code webview 中展示格式化后的提示词
- 支持一键复制到剪贴板
- 支持配置外部链接按钮，点击直接跳转到大模型网站并自动传递提示词参数

## 文件结构

```
vscode/
├── .vscode/
│   ├── launch.json          # VS Code 调试配置
│   └── settings.json        # 工作区设置
├── src/
│   └── extension.ts        # 主扩展逻辑
├── media/
│   └── webview.html         # webview HTML 模板
├── package.json             # 扩展清单
├── tsconfig.json            # TypeScript 配置
├── .gitignore               # Git 忽略
├── README.md                # 使用文档
└── Claude.md                # 开发总结（此文件）
```

## 关键实现点

### 1. 命令和菜单注册 (package.json)

```json
"contributes": {
  "commands": [
    {
      "command": "translation.translate",
      "title": "翻译"
    }
  ],
  "menus": {
    "editor/context": [
      {
        "command": "translation.translate",
        "group": "navigation",
        "when": "editorHasSelection"
      }
    ]
  }
}
```

- `editorHasSelection` 条件确保只在选中文本时显示菜单
- 激活事件 `onCommand:translation.translate` 实现懒加载

### 2. 配置项 (package.json)

```json
"configuration": {
  "title": "翻译",
  "properties": {
    "translation.promptTemplate": {
      "type": "string",
      "default": "请将{xx}翻译成为中文",
      "description": "翻译提示词模板，使用 {xx} 作为选中文本的占位符"
    },
    "translation.externalLinkName": {
      "type": "string",
      "default": "DeepSeek 问答",
      "description": "外部链接按钮名称，留空则不显示"
    },
    "translation.externalLinkUrl": {
      "type": "string",
      "default": "https://chat.deepseek.com/",
      "description": "外部链接 URL"
    },
    "translation.externalLinkParam": {
      "type": "string",
      "default": "prompt",
      "description": "URL 参数名称"
    }
  }
}
```

### 3. 核心流程 (extension.ts)

1. 获取活动编辑器
2. 获取选中文本，检查非空
3. 读取配置（提示词模板、外部链接配置）
4. 替换 `{xx}` 占位符得到格式化提示词
5. 读取 `media/webview.html` 模板
6. 替换 `{{prompt}}` 和 `{{externalLinkHtml}}` 占位符
7. 创建 `webviewPanel` 并设置 HTML
8. 监听 webview 消息：
   - `copy`: 调用 `vscode.env.clipboard.writeText()` 复制到剪贴板
   - `openLink`: 构造完整 URL（自动 URL 编码），调用 `vscode.env.openExternal()` 在浏览器打开

### 4. Webview 安全

- 添加 CSP meta 标签防止注入：
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
```
- 使用 VS Code CSS 变量适配主题：`var(--vscode-editor-background)` 等
- 对用户输入进行 HTML 转义防止 XSS

### 5. 外部链接跳转

构造 URL 逻辑：
```typescript
const encodedPrompt = encodeURIComponent(formattedPrompt);
const separator = externalLinkUrl.includes('?') ? '&' : '?';
const fullUrl = `${externalLinkUrl}${separator}${externalLinkParam}=${encodedPrompt}`;
vscode.env.openExternal(vscode.Uri.parse(fullUrl));
```

## 常用命令

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听编译
npm run watch

# 打包 vsix
npm install -g @vscode/vsce
vsce package
```

## 开发调试

1. 在 VS Code 打开项目目录
2. 按 `F5` 启动扩展开发主机
3. 在新窗口测试功能
4. 修改代码后重新编译，重启调试窗口

## 踩坑记录

1. **变量声明顺序**：在变量声明之前使用会导致 `ReferenceError`，需要先读取 HTML 模板得到 `htmlContent` 后再进行替换
2. **重复 case**：switch 中不能有重复的 case，需要删除重复
3. **CSP**：VS Code webview 需要添加 Content Security Policy

## 默认配置

| 配置项 | 默认值 |
|--------|--------|
| `translation.promptTemplate` | `请将{xx}翻译成为中文` |
| `translation.externalLinkName` | `DeepSeek 问答` |
| `translation.externalLinkUrl` | `https://chat.deepseek.com/` |
| `translation.externalLinkParam` | `prompt` |

## 打包输出

- 输出文件：`vscode-translate-plugin-0.0.1.vsix`
- 大小：~9.5KB

## 安装到 VS Code

1. 打开 VS Code → 扩展面板
2. 点击右上角 `...` → 「从 VSIX 安装...」
3. 选择 `.vsix` 文件
4. 重启 VS Code 生效
