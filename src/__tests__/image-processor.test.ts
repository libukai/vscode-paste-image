import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import { ImageProcessor } from '../image-processor';
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

describe('ImageProcessor', () => {
  let imageProcessor: ImageProcessor;
  let mockLogger: jest.Mocked<Logger>;
  let mockClipboardManager: jest.Mocked<ClipboardManager>;
  let mockEditor: jest.Mocked<vscode.TextEditor>;
  let mockDocument: jest.Mocked<vscode.TextDocument>;
  let mockSelection: vscode.Selection;

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
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      showErrorMessage: jest.fn(),
    } as any;

    // Mock ClipboardManager
    mockClipboardManager = {
      hasImage: jest.fn(),
      saveClipboardImageToFile: jest.fn(),
    } as any;

    // Mock VSCode Selection
    mockSelection = {
      isEmpty: true,
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    } as vscode.Selection;

    // Mock VSCode Document
    mockDocument = {
      uri: { scheme: 'file', fsPath: '/workspace/docs/README.md' },
      languageId: 'markdown',
      getText: jest.fn().mockReturnValue(''),
    } as any;

    // Mock VSCode Editor
    mockEditor = {
      document: mockDocument,
      selection: mockSelection,
      edit: jest.fn(),
    } as any;

    // Mock VSCode window
    mockVscode.window = {
      activeTextEditor: mockEditor,
      showInputBox: jest.fn(),
      showWarningMessage: jest.fn(),
    } as any;

    // Mock fs-extra
    mockFs.pathExists = jest.fn().mockResolvedValue(false);
    mockFs.stat = jest.fn().mockRejectedValue(new Error('Directory not found'));
    mockFs.ensureDir = jest.fn().mockResolvedValue(undefined);

    imageProcessor = new ImageProcessor(mockLogger, mockClipboardManager);
  });

  describe('pasteImage', () => {
    it('should throw error when no active editor', async () => {
      mockVscode.window.activeTextEditor = undefined;

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError('No active text editor found', ERROR_CODES.NO_ACTIVE_EDITOR)
      );
    });

    it('should throw error when file is unsaved', async () => {
      mockDocument.uri.scheme = 'untitled';

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError(
          'Please save the current file before pasting an image',
          ERROR_CODES.UNSAVED_FILE
        )
      );
    });

    it('should throw error when no image in clipboard', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(false);

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError('No image found in clipboard', ERROR_CODES.NO_IMAGE_IN_CLIPBOARD)
      );
    });

    it('should throw error when selected text is invalid filename', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockDocument.getText.mockReturnValue('invalid:filename');
      mockSelection.isEmpty = false;

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError(
          'Selected text contains invalid filename characters',
          ERROR_CODES.INVALID_FILENAME
        )
      );
    });

    it('should successfully paste image with default filename', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        imagePath: '/workspace/docs/2023-12-28-10-30-45.png',
      });
      mockEditor.edit.mockImplementation(callback => {
        callback({
          insert: jest.fn(),
          replace: jest.fn(),
        } as any);
        return Promise.resolve(true);
      });

      await imageProcessor.pasteImage(mockConfig);

      expect(mockClipboardManager.hasImage).toHaveBeenCalled();
      expect(mockClipboardManager.saveClipboardImageToFile).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully pasted image:')
      );
    });

    it('should use selected text as filename when valid', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        imagePath: '/workspace/docs/custom-name.png',
      });
      mockDocument.getText.mockReturnValue('custom-name');
      mockSelection.isEmpty = false;
      mockEditor.edit.mockImplementation(callback => {
        callback({
          insert: jest.fn(),
          replace: jest.fn(),
        } as any);
        return Promise.resolve(true);
      });

      await imageProcessor.pasteImage(mockConfig);

      expect(mockClipboardManager.saveClipboardImageToFile).toHaveBeenCalledWith(
        expect.stringContaining('custom-name.png')
      );
    });

    it('should handle file already exists with user confirmation', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        imagePath: '/workspace/docs/test.png',
      });
      mockFs.pathExists.mockResolvedValue(true);
      mockVscode.window.showWarningMessage.mockResolvedValue('Replace' as any);
      mockEditor.edit.mockImplementation(callback => {
        callback({
          insert: jest.fn(),
          replace: jest.fn(),
        } as any);
        return Promise.resolve(true);
      });

      await imageProcessor.pasteImage(mockConfig);

      expect(mockVscode.window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('already exists'),
        'Replace',
        'Cancel'
      );
      expect(mockClipboardManager.saveClipboardImageToFile).toHaveBeenCalled();
    });

    it('should cancel operation when user rejects file replacement', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockFs.pathExists.mockResolvedValue(true);
      mockVscode.window.showWarningMessage.mockResolvedValue('Cancel' as any);

      await imageProcessor.pasteImage(mockConfig);

      expect(mockVscode.window.showWarningMessage).toHaveBeenCalled();
      expect(mockClipboardManager.saveClipboardImageToFile).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Image paste operation cancelled - file already exists'
      );
    });

    it('should show confirmation input box when configured', async () => {
      const configWithConfirmation = { ...mockConfig, showFilePathConfirmInputBox: true };
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        imagePath: '/workspace/docs/confirmed-name.png',
      });
      mockVscode.window.showInputBox.mockResolvedValue('confirmed-name.png');
      mockEditor.edit.mockImplementation(callback => {
        callback({
          insert: jest.fn(),
          replace: jest.fn(),
        } as any);
        return Promise.resolve(true);
      });

      await imageProcessor.pasteImage(configWithConfirmation);

      expect(mockVscode.window.showInputBox).toHaveBeenCalledWith({
        prompt: 'Please specify the filename of the image:',
        value: expect.any(String),
        placeHolder: 'Enter filename or full path',
      });
    });

    it('should cancel operation when user cancels input box', async () => {
      const configWithConfirmation = { ...mockConfig, showFilePathConfirmInputBox: true };
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockVscode.window.showInputBox.mockResolvedValue(undefined);

      await imageProcessor.pasteImage(configWithConfirmation);

      expect(mockVscode.window.showInputBox).toHaveBeenCalled();
      expect(mockClipboardManager.saveClipboardImageToFile).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Image paste operation cancelled by user');
    });

    it('should handle clipboard save failure', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: false,
        error: 'Failed to save clipboard image',
      });

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError('Failed to save clipboard image', ERROR_CODES.SAVE_FAILED)
      );
    });

    it('should create directory when it does not exist', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockClipboardManager.saveClipboardImageToFile.mockResolvedValue({
        success: true,
        imagePath: '/workspace/docs/images/test.png',
      });
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));
      mockEditor.edit.mockImplementation(callback => {
        callback({
          insert: jest.fn(),
          replace: jest.fn(),
        } as any);
        return Promise.resolve(true);
      });

      await imageProcessor.pasteImage(mockConfig);

      expect(mockFs.ensureDir).toHaveBeenCalledWith('/workspace/docs/images');
      expect(mockLogger.debug).toHaveBeenCalledWith('Created directory: /workspace/docs/images');
    });

    it('should handle directory creation failure', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));
      mockFs.ensureDir.mockRejectedValue(new Error('Permission denied'));

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError(
          expect.stringContaining('Failed to create directory for image'),
          ERROR_CODES.SAVE_FAILED
        )
      );
    });

    it('should handle path exists but is not directory', async () => {
      mockClipboardManager.hasImage.mockResolvedValue(true);
      mockFs.stat.mockResolvedValue({
        isDirectory: () => false,
      } as any);

      await expect(imageProcessor.pasteImage(mockConfig)).rejects.toThrow(
        new PasteImageError(
          expect.stringContaining('exists but is not a directory'),
          ERROR_CODES.INVALID_CONFIG
        )
      );
    });
  });
});
