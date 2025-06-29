import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { format } from 'date-fns';
import { PasteImageConfig, PasteImageError, ERROR_CODES, WeChatUploadResult } from './types';
import { Logger } from './logger';
import { ClipboardManager } from './clipboard';
import { WeChatApiService } from './wechat-api';

/**
 * WeChat-specific image processor that uploads images to WeChat material library
 */
export class WeChatImageProcessor {
  private readonly logger: Logger;
  private readonly clipboardManager: ClipboardManager;
  private readonly wechatApiService: WeChatApiService;

  constructor(logger: Logger, clipboardManager: ClipboardManager) {
    this.logger = logger;
    this.clipboardManager = clipboardManager;
    this.wechatApiService = new WeChatApiService(logger);
  }

  /**
   * Main entry point for uploading image from clipboard to WeChat
   */
  public async pasteImageToWechat(config: PasteImageConfig): Promise<void> {
    try {
      // Validate WeChat configuration
      if (!config.wechat.enabled) {
        throw new PasteImageError(
          '微信素材库上传功能未启用。请在设置中启用 pasteImage.wechat.enabled',
          ERROR_CODES.WECHAT_CONFIG_INVALID
        );
      }

      // Get active editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        throw new PasteImageError('请先打开一个文本编辑器', ERROR_CODES.NO_ACTIVE_EDITOR);
      }

      // Check if file is saved
      if (editor.document.uri.scheme === 'untitled') {
        throw new PasteImageError('请先保存当前文件再粘贴图片', ERROR_CODES.UNSAVED_FILE);
      }

      // Check clipboard content
      const hasImage = await this.clipboardManager.hasImage();
      if (!hasImage) {
        throw new PasteImageError('剪贴板中没有图片', ERROR_CODES.NO_IMAGE_IN_CLIPBOARD);
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '正在上传图片到微信素材库...',
          cancellable: false,
        },
        async progress => {
          try {
            progress.report({ increment: 10, message: '检查剪贴板内容...' });

            // Create temporary file for the image
            const tempImagePath = await this.createTempImageFile(config);
            progress.report({ increment: 20, message: '保存临时图片文件...' });

            try {
              // Save clipboard image to temporary file
              const saveResult =
                await this.clipboardManager.saveClipboardImageToFile(tempImagePath);
              if (!saveResult.success) {
                throw new PasteImageError(
                  `保存剪贴板图片失败: ${saveResult.error}`,
                  ERROR_CODES.SAVE_FAILED
                );
              }

              progress.report({ increment: 30, message: '上传到微信素材库...' });

              // Upload to WeChat
              const uploadResult = await this.wechatApiService.uploadMaterial(
                config.wechat,
                tempImagePath,
                'image'
              );

              if (!uploadResult.success) {
                throw new PasteImageError(
                  `微信上传失败: ${uploadResult.error || uploadResult.errmsg}`,
                  ERROR_CODES.WECHAT_UPLOAD_FAILED
                );
              }

              progress.report({ increment: 20, message: '生成Markdown格式...' });

              // Generate markdown and insert
              const markdownText = this.generateMarkdownLink(uploadResult);
              await this.insertTextIntoEditor(editor, markdownText);

              progress.report({ increment: 20, message: '完成!' });

              // Show success message
              vscode.window.showInformationMessage(
                `图片已成功上传到微信素材库! Media ID: ${uploadResult.media_id}`
              );

              this.logger.info(`Successfully uploaded image to WeChat: ${uploadResult.media_id}`);
            } finally {
              // Clean up temporary file
              await this.cleanupTempFile(tempImagePath);
            }
          } catch (error) {
            this.logger.error('WeChat upload failed', error as Error);
            throw error;
          }
        }
      );
    } catch (error) {
      if (error instanceof PasteImageError) {
        await this.logger.showErrorMessage(error.message);
      } else {
        const errorMessage = `微信上传意外错误: ${(error as Error).message}`;
        await this.logger.showErrorMessage(errorMessage, error as Error);
      }
      throw error;
    }
  }

  /**
   * Create a temporary file path for the image
   */
  private async createTempImageFile(config: PasteImageConfig): Promise<string> {
    const tempDir = os.tmpdir();
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss-SSS');
    const fileName = `wechat-upload-${timestamp}.${config.imageFormat}`;
    const tempPath = path.join(tempDir, fileName);

    // Ensure temp directory exists
    await fs.ensureDir(path.dirname(tempPath));

    return tempPath;
  }

  /**
   * Generate markdown link from upload result
   */
  private generateMarkdownLink(uploadResult: WeChatUploadResult): string {
    if (uploadResult.url) {
      // Use the returned URL if available
      return `![](${uploadResult.url})`;
    } else if (uploadResult.media_id) {
      // If only media_id is available, create a placeholder
      return `![微信素材](wechat-media://${uploadResult.media_id})`;
    } else {
      // Fallback
      return `![微信素材](${uploadResult.media_id || 'unknown'})`;
    }
  }

  /**
   * Insert text into the editor
   */
  private async insertTextIntoEditor(editor: vscode.TextEditor, text: string): Promise<void> {
    const selection = editor.selection;
    await editor.edit(editBuilder => {
      if (selection.isEmpty) {
        editBuilder.insert(selection.start, text);
      } else {
        editBuilder.replace(selection, text);
      }
    });
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(tempPath: string): Promise<void> {
    try {
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
        this.logger.debug(`Cleaned up temporary file: ${tempPath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to clean up temporary file: ${tempPath}`, error as Error);
    }
  }

  /**
   * Test WeChat API configuration
   */
  public async testWeChatConfig(config: PasteImageConfig): Promise<boolean> {
    try {
      if (!config.wechat.enabled) {
        vscode.window.showWarningMessage('微信功能未启用');
        return false;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '测试微信API配置...',
          cancellable: false,
        },
        async () => {
          // Try to get access token
          const accessToken = await this.wechatApiService.getAccessToken(config.wechat);
          if (accessToken) {
            vscode.window.showInformationMessage('微信API配置测试成功！');
            return true;
          } else {
            vscode.window.showErrorMessage('微信API配置测试失败：无法获取访问令牌');
            return false;
          }
        }
      );
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(`微信API配置测试失败: ${(error as Error).message}`);
      this.logger.error('WeChat config test failed', error as Error);
      return false;
    }
  }
}
