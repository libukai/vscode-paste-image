# Change Log

## 1.0.0 (December 28, 2024)

### 🔄 Complete Rewrite & Modernization with WeChat Integration

This is a complete rewrite of the extension with modern TypeScript, VSCode APIs, and WeChat Material Library integration.

#### ✨ New Features
- **WeChat Material Library Integration**: Upload images directly to WeChat with automatic HTTPS URL generation
- **Dual Upload Modes**: Choose between local save (`Ctrl+Alt+V`) and WeChat upload (`Ctrl+Alt+W`)
- **Progress Notifications**: Real-time upload progress and status updates
- **Proxy Support**: Configure custom API endpoints for WeChat integration
- **Multi-format Support**: PNG, JPEG, WebP image formats
- **Enhanced Image Quality**: Configurable JPEG quality settings
- **Better Language Support**: Added reStructuredText and Org-mode support
- **Modern Date Formatting**: Migrated from moment.js to date-fns
- **Enhanced Error Handling**: Comprehensive error types and user-friendly messages
- **Type Safety**: Full TypeScript coverage with strict mode

#### 🏗️ Technical Improvements
- **TypeScript 5.2+**: Upgraded from TypeScript 1.8.5
- **VSCode API 1.75+**: Upgraded from VSCode 1.0.0
- **Modern Architecture**: Modular design with dependency injection
- **Async/Await**: Replaced callback patterns with modern async patterns
- **Comprehensive Testing**: Jest test suite with 80%+ coverage
- **Code Quality**: ESLint + Prettier integration

#### 🔧 Configuration Changes
- **WeChat Integration Settings**:
  - `pasteImage.wechat.enabled`: Enable/disable WeChat integration
  - `pasteImage.wechat.appId`: WeChat App ID
  - `pasteImage.wechat.appSecret`: WeChat App Secret
  - `pasteImage.wechat.baseUrl`: API base URL (supports proxy)
  - `pasteImage.wechat.useStableToken`: Use stable token API (recommended)
- **Enhanced Settings**:
  - `pasteImage.imageFormat`: Choose PNG, JPEG, or WebP
  - `pasteImage.jpegQuality`: Configure JPEG compression quality
- **Updated Defaults**:
  - `pasteImage.defaultName`: Now uses `yyyy-MM-dd-HH-mm-ss` (date-fns format)
- **Variable Changes**:
  - `${projectRoot}` → `${workspaceRoot}` (following VSCode conventions)

#### 🔄 Breaking Changes
- **Minimum VSCode Version**: Now requires VSCode 1.75.0+
- **Date Format Tokens**: Changed from moment.js to date-fns format
  - `YYYY` → `yyyy` (4-digit year)
  - `DD` → `dd` (2-digit day)
- **Configuration Migration Required**: Users with custom `defaultName` patterns need to update format tokens

#### 🛠️ Dependencies
- **Added**: date-fns, clipboardy, fs-extra@11.x, form-data
- **Removed**: moment, copy-paste, legacy type definitions
- **Updated**: All development dependencies to latest versions

#### 🌐 Localization
- **Chinese Interface**: Full Chinese localization for all settings and messages
- **Bilingual Documentation**: Both English and Chinese README files
- **WeChat Integration**: Native Chinese support for WeChat-related features

#### 🏆 Improvements
- **Performance**: Faster startup and execution
- **Reliability**: Better error handling and edge case coverage
- **Maintainability**: Clean, modular codebase with comprehensive tests
- **User Experience**: Better error messages and configuration validation
- **Cross-platform**: Improved clipboard handling on all platforms

---

## 1.0.4 (January 23, 2018)

- Fix: paste image get blank image issue (windows)

## 1.0.3 (November 28, 2018)

- Fix: paste translucent image get background issue (windows)
- Feature: Add `pasteImage.showFilePathConfirmInputBox` & `pasteImage.filePathConfirmInputBoxMode` configuration. Support show file path confirm inputbox before saving.

## 1.0.2 (June 6, 2018)

- Fix: `pasteImage.namePrefix` and `pasteImage.nameSuffix` not work when there is no text selected.

## 1.0.1 (May 31, 2018)

- Update readme

## 1.0.0 (May 31, 2018)

- Feature: Add `pasteImage.insertPattren` configuration. Support config the format of text would be pasted.
- Feature: Add `pasteImage.defaultName` configuration. Support config default image file name.
- Feature: Add `pasteImage.encodePath` configuration. Support url encode image file path.
- Feature: Add `pasteImage.namePrefix` configuration.
- Feature: Add `pasteImage.nameSuffix` configuration.

## 0.9.5 (December 16, 2017)

- Fix: Support select non-ascii text as file name

## 0.9.4 (July 7, 2017)

- Feature: Print log to "PasteImage" channel, and show in output panel.
- Fix: Paste fail when powershell not in PATH on windows. (from @ELBe7ery)

## 0.9.3 (July 5, 2017)

- Feature: Support select text as a sub path with multi new directory like `a/b/c/d/imageName` or `../a/b/c/d/imageName`
- Fix: Error when dest directory is not existed. (from @WindnBike)

## 0.9.2 (July 3, 2017)

- Improvement: Check if the dest directory is a file.

## 0.9.1 (July 3, 2017)

- Feature: `pasteImage.path` and `pasteImage.basePath` support `${currentFileName}` and `${currentFileNameWithoutExt}` variable.

## 0.9.0 (July 3, 2017)

- Feature: Add `pasteImage.basePath` configuration.
- Feature: `pasteImage.path` and `pasteImage.basePath` support `${currentFileDir}` and `${projectRoot}` variable.
- Feature: Add `pasteImage.forceUnixStyleSeparator` configuration.
- Feature: Add `pasteImage.prefix` configuration.
- Feature: Add `pasteImage.suffix` configuration.
- Feature: Support selected path as a sub path.

## 0.4.0 (July 3, 2017)

- Feature: Support AsciiDoc image markup

## 0.3.0 (December 31, 2016)

- Feature: Support config the path(absolute or relative) to save image.(@ysknkd in #4)

## 0.2.0 (November 13, 2016)

- Feature: Add linux support by xclip
- Feature: Support use the selected text as the image name

## 0.1.0 (November 12, 2016)

- Feature: Add windows support by powershell(@kivle in #2)

## 0.0.1

- Finish first publish. Only support macos.