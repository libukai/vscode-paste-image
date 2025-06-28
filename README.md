# Paste Image Modern

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Libukai/vscode-paste-image-modern)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![VSCode](https://img.shields.io/badge/VSCode-1.75+-green.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.txt)

A modern, fully rewritten VSCode extension for pasting images from clipboard directly into your documents. Built with TypeScript 5.x, latest VSCode APIs, and modern development practices.

![demo](res/vscode-paste-image.gif)

## ✨ Features

- 🖼️ **Multi-format Support**: PNG, JPEG, WebP image formats
- 📝 **Multiple Languages**: Markdown, AsciiDoc, reStructuredText, Org-mode
- ⌨️ **Easy to Use**: Simple `Ctrl+Alt+V` (or `Cmd+Alt+V` on Mac) shortcut
- 🎯 **Smart Naming**: Automatic timestamp-based naming with customizable patterns
- 📁 **Flexible Paths**: Configurable save locations with variable substitution
- 🔧 **Highly Configurable**: Extensive customization options
- 🚀 **Modern Architecture**: Built with async/await, proper error handling, and TypeScript
- 🧪 **Well Tested**: Comprehensive unit tests with Jest
- 🔍 **Type Safe**: Full TypeScript type coverage

## 🚀 Quick Start

1. **Install** the extension
2. **Copy** any image to your clipboard (screenshot, image file, etc.)
3. **Open** a Markdown or other supported file in VSCode
4. **Press** `Ctrl+Alt+V` (Windows/Linux) or `Cmd+Alt+V` (Mac)
5. **Done!** The image is saved and a reference is inserted

## 📖 Usage

### Basic Usage
1. Capture or copy an image to clipboard
2. Use one of these methods:
   - **Keyboard**: `Ctrl+Alt+V` / `Cmd+Alt+V`
   - **Command Palette**: `Ctrl+Shift+P` → "Paste Image"
3. Image is automatically saved and referenced in your document

### Advanced Features
- **Custom filename**: Select text before pasting to use as filename
- **Confirmation dialog**: Enable `showFilePathConfirmInputBox` to modify paths
- **Variable substitution**: Use `${currentFileDir}`, `${workspaceRoot}`, etc.
- **Multiple formats**: Choose PNG, JPEG, or WebP output format

## ⚙️ Configuration

### Core Settings

#### `pasteImage.path`
**Default**: `"${currentFileDir}"`

Directory where images will be saved. Supports variables:
- `${currentFileDir}` - Current file's directory
- `${workspaceRoot}` - Workspace root directory

```json
{
  "pasteImage.path": "${workspaceRoot}/assets/images"
}
```

#### `pasteImage.defaultName`
**Default**: `"yyyy-MM-dd-HH-mm-ss"`

Default filename pattern using [date-fns format tokens](https://date-fns.org/docs/format):
- `yyyy` - 4-digit year
- `MM` - 2-digit month
- `dd` - 2-digit day
- `HH` - 24-hour format hour
- `mm` - minutes
- `ss` - seconds

```json
{
  "pasteImage.defaultName": "screenshot-yyyy-MM-dd"
}
```

#### `pasteImage.imageFormat`
**Default**: `"png"`

Output image format. Options: `png`, `jpg`, `webp`

```json
{
  "pasteImage.imageFormat": "webp"
}
```

### Path & URL Configuration

#### `pasteImage.basePath`
**Default**: `"${currentFileDir}"`

Base path for calculating relative URLs in documents.

#### `pasteImage.prefix` / `pasteImage.suffix`
**Default**: `""` / `""`

Strings to prepend/append to the image path in documents.

```json
{
  "pasteImage.prefix": "./",
  "pasteImage.suffix": "?v=1"
}
```

#### `pasteImage.encodePath`
**Default**: `"urlEncodeSpace"`

How to encode image paths:
- `none` - No encoding
- `urlEncode` - Full URL encoding  
- `urlEncodeSpace` - Encode spaces only

### Advanced Settings

#### `pasteImage.insertPattern`
**Default**: `"${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}"`

Customize how image references are inserted. Available variables:
- `${imageSyntaxPrefix}` - Language-specific prefix (`![](` for Markdown)
- `${imageSyntaxSuffix}` - Language-specific suffix (`)` for Markdown)
- `${imageFilePath}` - Processed image path
- `${imageFileName}` - Image filename with extension
- `${imageFileNameWithoutExt}` - Image filename without extension

```json
{
  "pasteImage.insertPattern": "![${imageFileNameWithoutExt}](${imageFilePath})"
}
```

#### `pasteImage.showFilePathConfirmInputBox`
**Default**: `false`

Show input dialog to confirm/modify file path before saving.

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

## 🔄 Migration from v1.x

This is a complete rewrite with breaking changes:

### Updated Dependencies
- ✅ TypeScript 5.2+ (was 1.8.5)
- ✅ VSCode API 1.75+ (was 1.0.0)
- ✅ Modern date-fns (replaced moment.js)
- ✅ Modern clipboard handling

### Configuration Changes
- 📝 Date format: `YYYY-MM-DD` → `yyyy-MM-dd` (date-fns format)
- 📝 Variable: `${projectRoot}` → `${workspaceRoot}`
- ➕ New: `imageFormat`, `jpegQuality` options
- ➕ New: WebP format support

### Migration Steps
1. Update date patterns in `pasteImage.defaultName`
2. Replace `${projectRoot}` with `${workspaceRoot}`
3. Consider new image format options

## 🛠️ Development

Built with modern tools and practices:

- **TypeScript 5.2+** - Full type safety
- **ESLint + Prettier** - Code quality
- **Jest** - Unit testing with 80%+ coverage
- **date-fns** - Modern date formatting
- **Async/await** - Modern async patterns
- **Modular architecture** - Clean separation of concerns

## 📄 License

MIT License - see [LICENSE.txt](LICENSE.txt) for details.

## 🏗️ Project Status

This is a complete modernization of the original vscode-paste-image extension. Key improvements:

- **Performance**: Faster startup and execution
- **Reliability**: Better error handling and edge case coverage  
- **Maintainability**: Modern codebase with comprehensive tests
- **Features**: Additional image formats and configuration options
- **Compatibility**: Latest VSCode APIs and TypeScript features

## 👤 Author

**Libukai** - Complete rewrite and modernization

*Based on the original vscode-paste-image by mushan*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📊 What's New in v2.0

- 🔄 **Complete TypeScript rewrite** with modern patterns
- 🖼️ **Multiple image formats** (PNG, JPEG, WebP)
- 🏗️ **Modular architecture** with proper separation of concerns
- 🧪 **Comprehensive testing** with Jest
- 📝 **Better documentation** with examples
- ⚡ **Improved performance** and error handling
- 🔧 **Enhanced configuration** options
- 🌐 **Better cross-platform support**