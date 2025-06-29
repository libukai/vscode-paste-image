import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { WeChatImageProcessor } from '../wechat-image-processor';
import { Logger } from '../logger';
import { ClipboardManager } from '../clipboard';
import { PasteImageConfig, PasteImageError, ERROR_CODES } from '../types';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('vscode');
jest.mock('../logger');
jest.mock('../clipboard');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockVscode = vscode as jest.Mocked<typeof vscode>;

describe('WeChatImageProcessor', () => {
  let wechatImageProcessor: WeChatImageProcessor;
  let mockLogger: jest.Mocked<Logger>;
  let mockClipboardManager: jest.Mocked<ClipboardManager>;
  let mockEditor: jest.Mocked<vscode.TextEditor>;
  let mockDocument: jest.Mocked<vscode.TextDocument>;

  const mockConfig: PasteImageConfig = {
    path: '${currentFileDir}',
    basePath: '${currentFileDir}',
    forceUnixStyleSeparator: true,
    prefix: '',
    suffix: '',
    defaultName: 'yyyy-MM-dd-HH-mm-ss',
    namePrefix: '',
    nameSuffix: '',
    encodePath: 'urlEncodeSpace',
    insertPattern: '${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}',
    showFilePathConfirmInputBox: false,
    filePathConfirmInputBoxMode: 'fullPath',
    imageFormat: 'png',
    jpegQuality: 85,
    wechat: {
      enabled: true,
      appId: 'test_app_id',
      appSecret: 'test_app_secret',
      baseUrl: 'https://api.weixin.qq.com',
      useStableToken: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      showErrorMessage: jest.fn(),
    } as any;

    // Mock ClipboardManager
    mockClipboardManager = {
      hasImage: jest.fn(),
      saveClipboardImageToFile: jest.fn(),
    } as any;

    // Mock VSCode Document
    mockDocument = {
      uri: { scheme: 'file', fsPath: '/workspace/docs/README.md' },
      languageId: 'markdown',
      getText: jest.fn().mockReturnValue(''),
    } as any;

    // Mock VSCode Editor
    mockEditor = {
      document: mockDocument,
      selection: {
        isEmpty: true,
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
      edit: jest.fn(),
    } as any;

    // Mock VSCode window
    mockVscode.window = {
      activeTextEditor: mockEditor,
      withProgress: jest.fn(),
      showInformationMessage: jest.fn(),
      showErrorMessage: jest.fn(),
      showWarningMessage: jest.fn(),
    } as any;

    // Mock fs-extra
    mockFs.ensureDir = jest.fn().mockResolvedValue(undefined);
    mockFs.pathExists = jest.fn().mockResolvedValue(true);
    mockFs.remove = jest.fn().mockResolvedValue(undefined);

    wechatImageProcessor = new WeChatImageProcessor(mockLogger, mockClipboardManager);
  });

  describe('pasteImageToWechat', () => {
    it('should throw error when WeChat is disabled', async () => {
      const disabledConfig = { ...mockConfig, wechat: { ...mockConfig.wechat, enabled: false } };

      await expect(wechatImageProcessor.pasteImageToWechat(disabledConfig)).rejects.toThrow(
        new PasteImageError(
          '微信素材库上传功能未启用。请在设置中启用 pasteImage.wechat.enabled',
          ERROR_CODES.WECHAT_CONFIG_INVALID
        )
      );
    });

    it('should throw error when no active editor', async () => {
      mockVscode.window.activeTextEditor = undefined;

      await expect(wechatImageProcessor.pasteImageToWechat(mockConfig)).rejects.toThrow(
        new PasteImageError('请先打开一个文本编辑器', ERROR_CODES.NO_ACTIVE_EDITOR)
      );
    });

    it('should throw error when file is unsaved', async () => {
      mockDocument.uri.scheme = 'untitled';

      await expect(wechatImageProcessor.pasteImageToWechat(mockConfig)).rejects.toThrow(
        new PasteImageError('请先保存当前文件再粘贴图片', ERROR_CODES.UNSAVED_FILE)
      );
    });

    it('should throw error when no image in clipboard', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(false);

      await expect(wechatImageProcessor.pasteImageToWechat(mockConfig)).rejects.toThrow(
        new PasteImageError('剪贴板中没有图片', ERROR_CODES.NO_IMAGE_IN_CLIPBOARD)
      );
    });

    it('should successfully upload image and insert markdown', async () => {
      // Mock successful clipboard and upload
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        filePath: '/tmp/test-image.png',
      });

      // Mock progress function
      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        const mockProgress = { report: jest.fn() };
        return await callback(mockProgress);
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      // Mock editor.edit
      mockEditor.edit.mockImplementation(callback => {
        callback({ insert: jest.fn(), replace: jest.fn() } as any);
        return Promise.resolve(true);
      });

      // Mock the WeChat API service
      const mockWeChatApiService = {
        getAccessToken: jest.fn().mockResolvedValue('test_token'),
        uploadMaterial: jest.fn().mockResolvedValue({
          success: true,
          media_id: 'test_media_id',
          url: 'https://mmbiz.qpic.cn/test.jpg',
        }),
      };

      // Replace the wechatApiService in the processor
      (wechatImageProcessor as any).wechatApiService = mockWeChatApiService;

      await wechatImageProcessor.pasteImageToWechat(mockConfig);

      expect(mockClipboardManager.hasImage).toHaveBeenCalled();
      expect(mockVscode.window.withProgress).toHaveBeenCalled();
      expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('图片已成功上传到微信素材库')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully uploaded image to WeChat')
      );
    });

    it('should handle clipboard save failure', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: false,
        error: 'Failed to save clipboard image',
      });

      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        const mockProgress = { report: jest.fn() };
        try {
          return await callback(mockProgress);
        } catch (error) {
          throw error;
        }
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      await expect(wechatImageProcessor.pasteImageToWechat(mockConfig)).rejects.toThrow(
        new PasteImageError(
          '保存剪贴板图片失败: Failed to save clipboard image',
          ERROR_CODES.SAVE_FAILED
        )
      );
    });

    it('should handle WeChat upload failure', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        filePath: '/tmp/test-image.png',
      });

      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        const mockProgress = { report: jest.fn() };
        try {
          return await callback(mockProgress);
        } catch (error) {
          throw error;
        }
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      // Mock failed WeChat upload
      const mockWeChatApiService = {
        getAccessToken: jest.fn().mockResolvedValue('test_token'),
        uploadMaterial: jest.fn().mockResolvedValue({
          success: false,
          error: 'Upload failed',
        }),
      };

      (wechatImageProcessor as any).wechatApiService = mockWeChatApiService;

      await expect(wechatImageProcessor.pasteImageToWechat(mockConfig)).rejects.toThrow(
        new PasteImageError('微信上传失败: Upload failed', ERROR_CODES.WECHAT_UPLOAD_FAILED)
      );
    });

    it('should clean up temporary file after operation', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        filePath: '/tmp/test-image.png',
      });

      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        const mockProgress = { report: jest.fn() };
        return await callback(mockProgress);
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      mockEditor.edit.mockImplementation(callback => {
        callback({ insert: jest.fn(), replace: jest.fn() } as any);
        return Promise.resolve(true);
      });

      const mockWeChatApiService = {
        getAccessToken: jest.fn().mockResolvedValue('test_token'),
        uploadMaterial: jest.fn().mockResolvedValue({
          success: true,
          media_id: 'test_media_id',
          url: 'https://mmbiz.qpic.cn/test.jpg',
        }),
      };

      (wechatImageProcessor as any).wechatApiService = mockWeChatApiService;

      await wechatImageProcessor.pasteImageToWechat(mockConfig);

      expect(mockFs.remove).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up temporary file')
      );
    });
  });

  describe('testWeChatConfig', () => {
    it('should show warning when WeChat is disabled', async () => {
      const disabledConfig = { ...mockConfig, wechat: { ...mockConfig.wechat, enabled: false } };

      const result = await wechatImageProcessor.testWeChatConfig(disabledConfig);

      expect(result).toBe(false);
      expect(mockVscode.window.showWarningMessage).toHaveBeenCalledWith('微信功能未启用');
    });

    it('should show success message when config is valid', async () => {
      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        return await callback();
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      // Mock successful token retrieval
      const mockWeChatApiService = {
        getAccessToken: jest.fn().mockResolvedValue('test_token'),
      };

      (wechatImageProcessor as any).wechatApiService = mockWeChatApiService;

      const result = await wechatImageProcessor.testWeChatConfig(mockConfig);

      expect(result).toBe(true);
      expect(mockVscode.window.showInformationMessage).toHaveBeenCalledWith(
        '微信API配置测试成功！'
      );
    });

    it('should show error message when config test fails', async () => {
      const mockProgressCallback = jest.fn().mockImplementation(async callback => {
        try {
          return await callback();
        } catch (error) {
          throw error;
        }
      });
      mockVscode.window.withProgress.mockImplementation(mockProgressCallback);

      // Mock failed token retrieval
      const mockWeChatApiService = {
        getAccessToken: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
      };

      (wechatImageProcessor as any).wechatApiService = mockWeChatApiService;

      const result = await wechatImageProcessor.testWeChatConfig(mockConfig);

      expect(result).toBe(false);
      expect(mockVscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('微信API配置测试失败')
      );
    });
  });
});
