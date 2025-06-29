# 现代图片粘贴

[![版本](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Libukai/vscode-paste-image-modern)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![VSCode](https://img.shields.io/badge/VSCode-1.75+-green.svg)](https://code.visualstudio.com/)
[![许可证](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

*[English README](README.md)*

一个现代化的、完全重写的 VSCode 扩展，支持从剪贴板直接粘贴图片到文档中，**集成微信素材库上传功能**。使用 TypeScript 5.x、最新的 VSCode API 和现代开发实践构建。

![演示](res/vscode-paste-image.gif)

## ✨ 核心特性

### 🖼️ **双重上传选项**
- **本地保存**: 传统的剪贴板到本地文件保存
- **微信上传**: 直接上传到微信素材库并自动生成 HTTPS URL

### 📝 **多语言文档支持**
- Markdown、AsciiDoc、reStructuredText、Org-mode
- 自动语法检测和格式化

### ⌨️ **便捷快捷键**
- `Ctrl+Alt+V` (Windows/Linux) / `Cmd+Alt+V` (Mac) - 粘贴到本地文件
- `Ctrl+Alt+W` (Windows/Linux) / `Cmd+Alt+W` (Mac) - 上传到微信

### 🔧 **高级配置**
- 多种图片格式：PNG、JPEG、WebP
- 基于 date-fns 的自定义命名模式
- 支持变量替换的灵活路径配置
- 微信 API 集成，支持代理服务器

### 🚀 **现代架构**
- 使用 TypeScript 5.x 和 async/await 构建
- 全面的错误处理和用户反馈
- Jest 全覆盖测试
- 类型安全的配置管理

## 🚀 快速开始

### 基本使用
1. **安装** 从 VSCode 市场安装扩展
2. **复制** 任意图片到剪贴板
3. **打开** Markdown 或支持的文件
4. **按下** `Ctrl+Alt+V` 本地保存或 `Ctrl+Alt+W` 微信上传
5. **完成！** 图片已保存/上传并插入引用

### 微信集成设置
1. 获取微信应用凭据（AppID 和 AppSecret）
2. 配置扩展：
   ```json
   {
     "pasteImage.wechat.enabled": true,
     "pasteImage.wechat.appId": "你的_app_id",
     "pasteImage.wechat.appSecret": "你的_app_secret",
     "pasteImage.wechat.baseUrl": "https://api.weixin.qq.com"
   }
   ```
3. 使用 `Ctrl+Alt+W` 直接上传图片到微信素材库

## ⚙️ 配置选项

### 核心设置

#### 本地文件设置
| 设置项 | 默认值 | 描述 |
|--------|--------|------|
| `pasteImage.path` | `"${currentFileDir}"` | 图片保存目录 |
| `pasteImage.defaultName` | `"yyyy-MM-dd-HH-mm-ss"` | 使用 date-fns 的文件名模式 |
| `pasteImage.imageFormat` | `"png"` | 输出格式：png、jpg、webp |

#### 微信集成设置
| 设置项 | 默认值 | 描述 |
|--------|--------|------|
| `pasteImage.wechat.enabled` | `false` | 启用微信集成 |
| `pasteImage.wechat.appId` | `""` | 微信 App ID |
| `pasteImage.wechat.appSecret` | `""` | 微信 App Secret |
| `pasteImage.wechat.baseUrl` | `"https://api.weixin.qq.com"` | API 基础 URL（支持代理） |
| `pasteImage.wechat.useStableToken` | `true` | 使用稳定版 token API（推荐） |

#### 高级设置
| 设置项 | 默认值 | 描述 |
|--------|--------|------|
| `pasteImage.insertPattern` | `"${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}"` | 自定义插入模式 |
| `pasteImage.showFilePathConfirmInputBox` | `false` | 显示确认对话框 |
| `pasteImage.encodePath` | `"urlEncodeSpace"` | 路径编码方法 |

### 变量替换

路径和模式中可用的变量：
- `${currentFileDir}` - 当前文件目录
- `${workspaceRoot}` - 工作区根目录
- `${imageFilePath}` - 处理后的图片路径
- `${imageFileName}` - 带扩展名的图片文件名
- `${imageFileNameWithoutExt}` - 不含扩展名的图片文件名
- `${imageSyntaxPrefix}` - 语言特定前缀（如 Markdown 的 `![](` ）
- `${imageSyntaxSuffix}` - 语言特定后缀（如 Markdown 的 `)` ）

## 🔧 配置示例

### 博客设置（Hexo/Jekyll）
```json
{
  "pasteImage.path": "${workspaceRoot}/assets/images",
  "pasteImage.basePath": "${workspaceRoot}",
  "pasteImage.prefix": "/assets/images/",
  "pasteImage.forceUnixStyleSeparator": true
}
```

### 微信内容创作
```json
{
  "pasteImage.wechat.enabled": true,
  "pasteImage.wechat.appId": "wx1234567890abcdef",
  "pasteImage.wechat.appSecret": "你的密钥",
  "pasteImage.wechat.baseUrl": "https://你的代理.com"
}
```

### 文档项目
```json
{
  "pasteImage.path": "${currentFileDir}/images",
  "pasteImage.defaultName": "图-yyyy-MM-dd-HHmmss",
  "pasteImage.namePrefix": "${currentFileNameWithoutExt}_"
}
```

### 自定义 HTML 输出
```json
{
  "pasteImage.insertPattern": "<img src=\"${imageFilePath}\" alt=\"${imageFileNameWithoutExt}\" />"
}
```

## 🌍 支持平台

- ✅ **Windows**（基于 PowerShell 的剪贴板访问）
- ✅ **macOS**（基于 AppleScript 的剪贴板访问）
- ✅ **Linux**（基于 xclip 的剪贴板访问）

## 📋 支持的语言

自动检测文档类型并插入适当语法：

- **Markdown**: `![](image.png)`
- **AsciiDoc**: `image::image.png[]`
- **reStructuredText**: `.. image:: image.png`
- **Org-mode**: `[[image.png]]`
- **其他文件**: 原始文件路径

## 🆕 v1.0 新特性

### 🎯 主要功能
- **微信素材库集成**: 直接上传图片到微信并自动生成 HTTPS URL
- **双重上传模式**: 在本地保存和微信上传之间选择
- **进度通知**: 实时上传进度和状态更新
- **代理支持**: 为微信集成配置自定义 API 端点

### 🔧 技术改进
- **TypeScript 5.x**: 使用现代 TypeScript 完全重写
- **增强错误处理**: 用户友好的错误消息和恢复机制
- **性能改进**: 更快的启动和执行速度
- **更好的跨平台支持**: 在所有平台上增强剪贴板处理

### 🌐 本地化
- **中文界面**: 所有设置和消息的完整中文本地化
- **双语文档**: 英文和中文文档

## 🛠️ 开发技术

使用现代工具和实践构建：

- **TypeScript 5.2+** - 完整类型安全和现代语言特性
- **ESLint + Prettier** - 代码质量和一致格式化
- **Jest** - 80%+ 覆盖率的全面单元测试
- **date-fns** - 现代日期格式化库
- **Async/await** - 现代异步编程模式
- **模块化架构** - 清晰的关注点分离

## 🔒 安全与隐私

- **安全令牌管理**: 自动访问令牌缓存和刷新
- **配置验证**: 全面的输入验证和错误处理
- **无数据收集**: 所有操作在本地执行或使用您配置的端点
- **代理支持**: 使用您自己的代理服务器增强安全性

## 🤝 贡献

欢迎贡献！请随时提交问题和拉取请求。

1. Fork 仓库
2. 创建您的特性分支（`git checkout -b feature/amazing-feature`）
3. 提交您的更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开拉取请求

## 📄 许可证

MIT 许可证 - 详情请参见 [LICENSE.txt](LICENSE.txt)。

## 👤 作者

**Libukai** - 完全重写和现代化，集成微信功能

*基于原始 vscode-paste-image 概念*

## 🔗 链接

- [GitHub 仓库](https://github.com/Libukai/vscode-paste-image-modern)
- [VSCode 市场](https://marketplace.visualstudio.com/items?itemName=Libukai.vscode-paste-image-modern)
- [问题跟踪](https://github.com/Libukai/vscode-paste-image-modern/issues)

## 📊 与原版对比

| 特性 | 原版 | 现代图片粘贴 |
|------|------|-------------|
| TypeScript 版本 | 1.8.5 (2016) | 5.2+ (2024) |
| VSCode API | 1.0.0 | 1.75+ |
| 日期库 | moment.js | date-fns |
| 架构 | 回调基础 | Async/await |
| 微信集成 | ❌ | ✅ |
| 进度反馈 | ❌ | ✅ |
| 测试覆盖 | ❌ | 80%+ |
| 中文本地化 | ❌ | ✅ |
| 代理支持 | ❌ | ✅ |
| 现代错误处理 | ❌ | ✅ |

---

**现代图片粘贴** - 用现代技术和微信集成让图片插入变得轻松！🚀

## 💡 使用技巧

### 微信素材库最佳实践
1. **配置代理**: 如果直接访问微信API有问题，可以配置代理服务器
2. **使用稳定Token**: 推荐启用 `useStableToken` 选项获得更好的稳定性
3. **批量操作**: 可以连续上传多张图片，每次操作都会获得新的URL

### 高效工作流
1. **预设配置**: 为不同项目设置不同的工作区配置
2. **快捷键熟练**: 记住 `Ctrl+Alt+V`（本地）和 `Ctrl+Alt+W`（微信）
3. **模式定制**: 使用 `insertPattern` 创建符合项目需求的自定义格式

### 故障排除
- **网络问题**: 检查 `baseUrl` 配置，确保网络可达
- **权限问题**: 确认微信应用有上传素材的权限
- **格式问题**: 验证 AppID 和 AppSecret 格式正确

立即开始使用现代图片粘贴，体验高效的图片管理工作流！