# Paste Image Modern

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Libukai/vscode-paste-image-modern)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![VSCode](https://img.shields.io/badge/VSCode-1.75+-green.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

*[中文版 README](README_zh.md)*

A modern, fully rewritten VSCode extension for pasting images from clipboard directly into your documents with **WeChat Material Library integration**. Built with TypeScript 5.x, latest VSCode APIs, and modern development practices.

![demo](res/vscode-paste-image.gif)

## ✨ Key Features

### 🖼️ **Dual Upload Options**
- **Local Save**: Traditional clipboard to local file saving
- **WeChat Upload**: Direct upload to WeChat Material Library with automatic HTTPS URL generation

### 📝 **Multi-Language Support**
- Markdown, AsciiDoc, reStructuredText, Org-mode
- Automatic syntax detection and formatting

### ⌨️ **Convenient Shortcuts**
- `Ctrl+Alt+V` (Windows/Linux) / `Cmd+Alt+V` (Mac) - Paste to local file
- `Ctrl+Alt+W` (Windows/Linux) / `Cmd+Alt+W` (Mac) - Upload to WeChat

### 🔧 **Advanced Configuration**
- Multiple image formats: PNG, JPEG, WebP
- Customizable naming patterns with date-fns
- Flexible path configuration with variable substitution
- WeChat API integration with proxy support

### 🚀 **Modern Architecture**
- Built with TypeScript 5.x and async/await
- Comprehensive error handling and user feedback
- Full test coverage with Jest
- Type-safe configuration management

## 🚀 Quick Start

### Basic Usage
1. **Install** the extension from VSCode Marketplace
2. **Copy** any image to your clipboard
3. **Open** a Markdown or supported file
4. **Press** `Ctrl+Alt+V` for local save or `Ctrl+Alt+W` for WeChat upload
5. **Done!** Image is saved/uploaded and reference is inserted

### WeChat Integration Setup
1. Get your WeChat App credentials (AppID and AppSecret)
2. Configure the extension:
   ```json
   {
     "pasteImage.wechat.enabled": true,
     "pasteImage.wechat.appId": "your_app_id",
     "pasteImage.wechat.appSecret": "your_app_secret",
     "pasteImage.wechat.baseUrl": "https://api.weixin.qq.com"
   }
   ```
3. Use `Ctrl+Alt+W` to upload images directly to WeChat Material Library

## ⚙️ Configuration

### Core Settings

#### Local File Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `pasteImage.path` | `"${currentFileDir}"` | Directory to save images |
| `pasteImage.defaultName` | `"yyyy-MM-dd-HH-mm-ss"` | Filename pattern using date-fns |
| `pasteImage.imageFormat` | `"png"` | Output format: png, jpg, webp |

#### WeChat Integration Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `pasteImage.wechat.enabled` | `false` | Enable WeChat integration |
| `pasteImage.wechat.appId` | `""` | WeChat App ID |
| `pasteImage.wechat.appSecret` | `""` | WeChat App Secret |
| `pasteImage.wechat.baseUrl` | `"https://api.weixin.qq.com"` | API base URL (supports proxy) |
| `pasteImage.wechat.useStableToken` | `true` | Use stable token API (recommended) |

#### Advanced Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `pasteImage.insertPattern` | `"${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}"` | Custom insertion pattern |
| `pasteImage.showFilePathConfirmInputBox` | `false` | Show confirmation dialog |
| `pasteImage.encodePath` | `"urlEncodeSpace"` | Path encoding method |

### Variable Substitution

Available variables for paths and patterns:
- `${currentFileDir}` - Current file's directory
- `${workspaceRoot}` - Workspace root directory
- `${imageFilePath}` - Processed image path
- `${imageFileName}` - Image filename with extension
- `${imageFileNameWithoutExt}` - Image filename without extension
- `${imageSyntaxPrefix}` - Language-specific prefix (e.g., `![](` for Markdown)
- `${imageSyntaxSuffix}` - Language-specific suffix (e.g., `)` for Markdown)

## 🔧 Configuration Examples

### Blog Setup (Hexo/Jekyll)
```json
{
  "pasteImage.path": "${workspaceRoot}/assets/images",
  "pasteImage.basePath": "${workspaceRoot}",
  "pasteImage.prefix": "/assets/images/",
  "pasteImage.forceUnixStyleSeparator": true
}
```

### WeChat Content Creation
```json
{
  "pasteImage.wechat.enabled": true,
  "pasteImage.wechat.appId": "wx1234567890abcdef",
  "pasteImage.wechat.appSecret": "your_secret_here",
  "pasteImage.wechat.baseUrl": "https://your-proxy.com"
}
```

### Documentation Project
```json
{
  "pasteImage.path": "${currentFileDir}/images",
  "pasteImage.defaultName": "fig-yyyy-MM-dd-HHmmss",
  "pasteImage.namePrefix": "${currentFileNameWithoutExt}_"
}
```

### Custom HTML Output
```json
{
  "pasteImage.insertPattern": "<img src=\"${imageFilePath}\" alt=\"${imageFileNameWithoutExt}\" />"
}
```

## 🌍 Supported Platforms

- ✅ **Windows** (PowerShell-based clipboard access)
- ✅ **macOS** (AppleScript-based clipboard access)  
- ✅ **Linux** (xclip-based clipboard access)

## 📋 Supported Languages

Auto-detects document type and inserts appropriate syntax:

- **Markdown**: `![](image.png)`
- **AsciiDoc**: `image::image.png[]`
- **reStructuredText**: `.. image:: image.png`
- **Org-mode**: `[[image.png]]`
- **Other files**: Raw file path

## 🆕 What's New in v1.0

### 🎯 Major Features
- **WeChat Material Library Integration**: Upload images directly to WeChat with automatic HTTPS URL generation
- **Dual Upload Modes**: Choose between local save and WeChat upload
- **Progress Notifications**: Real-time upload progress and status updates
- **Proxy Support**: Configure custom API endpoints for WeChat integration

### 🔧 Technical Improvements
- **TypeScript 5.x**: Complete rewrite with modern TypeScript
- **Enhanced Error Handling**: User-friendly error messages and recovery
- **Improved Performance**: Faster startup and execution
- **Better Cross-Platform Support**: Enhanced clipboard handling on all platforms

### 🌐 Localization
- **Chinese Interface**: Full Chinese localization for all settings and messages
- **Bilingual Documentation**: Both English and Chinese documentation

## 🛠️ Development

Built with modern tools and practices:

- **TypeScript 5.2+** - Full type safety and modern language features
- **ESLint + Prettier** - Code quality and consistent formatting
- **Jest** - Comprehensive unit testing with 80%+ coverage
- **date-fns** - Modern date formatting library
- **Async/await** - Modern asynchronous programming patterns
- **Modular Architecture** - Clean separation of concerns

## 🔒 Security & Privacy

- **Secure Token Management**: Automatic access token caching and refresh
- **Configuration Validation**: Comprehensive input validation and error handling
- **No Data Collection**: All operations are performed locally or with your configured endpoints
- **Proxy Support**: Use your own proxy servers for enhanced security

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE.txt](LICENSE.txt) for details.

## 👤 Author

**Libukai** - Complete rewrite and modernization with WeChat integration

*Based on the original vscode-paste-image concept*

## 🔗 Links

- [GitHub Repository](https://github.com/Libukai/vscode-paste-image-modern)
- [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=Libukai.vscode-paste-image-modern)
- [Issue Tracker](https://github.com/Libukai/vscode-paste-image-modern/issues)

## 📊 Comparison with Original

| Feature | Original | Paste Image Modern |
|---------|----------|-------------------|
| TypeScript Version | 1.8.5 (2016) | 5.2+ (2024) |
| VSCode API | 1.0.0 | 1.75+ |
| Date Library | moment.js | date-fns |
| Architecture | Callback-based | Async/await |
| WeChat Integration | ❌ | ✅ |
| Progress Feedback | ❌ | ✅ |
| Test Coverage | ❌ | 80%+ |
| Chinese Localization | ❌ | ✅ |
| Proxy Support | ❌ | ✅ |
| Modern Error Handling | ❌ | ✅ |

---

**Paste Image Modern** - Making image insertion effortless with modern technology and WeChat integration! 🚀