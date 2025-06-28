import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import { PasteImageError, ERROR_CODES } from '../types';
import { Logger } from '../logger';

// Mock vscode workspace configuration
const mockWorkspaceConfig = {
  get: jest.fn(),
};

// Mock logger
const mockLogger = {
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

beforeEach(() => {
  jest.clearAllMocks();
  (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockWorkspaceConfig);
});

describe('ConfigManager', () => {
  describe('getConfig', () => {
    it('should return default configuration when no custom config is provided', () => {
      mockWorkspaceConfig.get.mockImplementation((_key: string, defaultValue: any) => defaultValue);

      const config = ConfigManager.getConfig();

      expect(config.path).toBe('${currentFileDir}');
      expect(config.basePath).toBe('${currentFileDir}');
      expect(config.forceUnixStyleSeparator).toBe(true);
      expect(config.defaultName).toBe('yyyy-MM-dd-HH-mm-ss');
      expect(config.encodePath).toBe('urlEncodeSpace');
      expect(config.imageFormat).toBe('png');
      expect(config.jpegQuality).toBe(85);
    });

    it('should use custom configuration values when provided', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        const customConfig: Record<string, any> = {
          path: '${workspaceRoot}/assets',
          basePath: '',
          forceUnixStyleSeparator: false,
          prefix: './images/',
          suffix: '?v=1',
          defaultName: 'image-yyyy-MM-dd',
          namePrefix: 'img_',
          nameSuffix: '_final',
          encodePath: 'urlEncode',
          insertPattern: '![${imageFileName}](${imageFilePath})',
          showFilePathConfirmInputBox: true,
          filePathConfirmInputBoxMode: 'onlyName',
          imageFormat: 'jpg',
          jpegQuality: 95,
        };
        return customConfig[key] !== undefined ? customConfig[key] : defaultValue;
      });

      const config = ConfigManager.getConfig();

      expect(config.path).toBe('${workspaceRoot}/assets');
      expect(config.basePath).toBe('');
      expect(config.forceUnixStyleSeparator).toBe(false);
      expect(config.prefix).toBe('./images/');
      expect(config.suffix).toBe('?v=1');
      expect(config.defaultName).toBe('image-yyyy-MM-dd');
      expect(config.namePrefix).toBe('img_');
      expect(config.nameSuffix).toBe('_final');
      expect(config.encodePath).toBe('urlEncode');
      expect(config.insertPattern).toBe('![${imageFileName}](${imageFilePath})');
      expect(config.showFilePathConfirmInputBox).toBe(true);
      expect(config.filePathConfirmInputBoxMode).toBe('onlyName');
      expect(config.imageFormat).toBe('jpg');
      expect(config.jpegQuality).toBe(95);
    });

    it('should validate and throw error for invalid path configuration', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'path') return '  /invalid/path/with/spaces  ';
        return defaultValue;
      });

      expect(() => ConfigManager.getConfig()).toThrow(PasteImageError);
      try {
        ConfigManager.getConfig();
      } catch (error) {
        expect(error).toBeInstanceOf(PasteImageError);
        expect((error as PasteImageError).code).toBe(ERROR_CODES.INVALID_CONFIG);
      }
    });

    it('should validate and throw error for invalid basePath configuration', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'basePath') return '  /invalid/basePath/  ';
        return defaultValue;
      });

      expect(() => ConfigManager.getConfig()).toThrow(PasteImageError);
      try {
        ConfigManager.getConfig();
      } catch (error) {
        expect(error).toBeInstanceOf(PasteImageError);
        expect((error as PasteImageError).code).toBe(ERROR_CODES.INVALID_CONFIG);
      }
    });

    it('should clamp JPEG quality to valid range', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'imageFormat') return 'jpg';
        if (key === 'jpegQuality') return 150; // Invalid quality > 100, should be clamped to 100
        return defaultValue;
      });

      const config = ConfigManager.getConfig();
      expect(config.jpegQuality).toBe(100); // Should be clamped to maximum
    });

    it('should validate and throw error for empty default name', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'defaultName') return '';
        return defaultValue;
      });

      expect(() => ConfigManager.getConfig()).toThrow(PasteImageError);
      try {
        ConfigManager.getConfig();
      } catch (error) {
        expect(error).toBeInstanceOf(PasteImageError);
        expect((error as PasteImageError).code).toBe(ERROR_CODES.INVALID_CONFIG);
      }
    });

    it('should handle invalid enum values by using defaults', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'encodePath') return 'invalidEncoding';
        if (key === 'filePathConfirmInputBoxMode') return 'invalidMode';
        if (key === 'imageFormat') return 'invalidFormat';
        return defaultValue;
      });

      const config = ConfigManager.getConfig();

      expect(config.encodePath).toBe('urlEncodeSpace'); // default
      expect(config.filePathConfirmInputBoxMode).toBe('fullPath'); // default
      expect(config.imageFormat).toBe('png'); // default
    });

    it('should handle invalid number values by using defaults', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'jpegQuality') return 'not-a-number';
        return defaultValue;
      });

      const config = ConfigManager.getConfig();

      expect(config.jpegQuality).toBe(85); // default
    });

    it('should clamp number values to valid ranges', () => {
      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'jpegQuality') return -10; // Below minimum
        return defaultValue;
      });

      let config = ConfigManager.getConfig();
      expect(config.jpegQuality).toBe(1); // minimum

      mockWorkspaceConfig.get.mockImplementation((key: string, defaultValue: any) => {
        if (key === 'jpegQuality') return 150; // Above maximum
        return defaultValue;
      });

      config = ConfigManager.getConfig();
      expect(config.jpegQuality).toBe(100); // maximum
    });
  });

  describe('onConfigurationChanged', () => {
    it('should register configuration change listener', () => {
      const callback = jest.fn();
      const mockDisposable = { dispose: jest.fn() };
      (vscode.workspace.onDidChangeConfiguration as jest.Mock).mockReturnValue(mockDisposable);

      const disposable = ConfigManager.onConfigurationChanged(callback, mockLogger);

      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
      expect(disposable).toBe(mockDisposable);
    });

    it('should call callback when pasteImage configuration changes', () => {
      const callback = jest.fn();
      let changeHandler: (e: any) => void = () => {};

      (vscode.workspace.onDidChangeConfiguration as jest.Mock).mockImplementation(handler => {
        changeHandler = handler;
        return { dispose: jest.fn() };
      });

      ConfigManager.onConfigurationChanged(callback, mockLogger);

      // Mock configuration values for callback
      mockWorkspaceConfig.get.mockImplementation((_key: string, defaultValue: any) => defaultValue);

      // Simulate configuration change
      const mockEvent = {
        affectsConfiguration: jest.fn().mockReturnValue(true),
      };

      changeHandler(mockEvent);

      expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('pasteImage');
      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback when other configuration changes', () => {
      const callback = jest.fn();
      let changeHandler: (e: any) => void = () => {};

      (vscode.workspace.onDidChangeConfiguration as jest.Mock).mockImplementation(handler => {
        changeHandler = handler;
        return { dispose: jest.fn() };
      });

      ConfigManager.onConfigurationChanged(callback, mockLogger);

      // Simulate configuration change for different section
      const mockEvent = {
        affectsConfiguration: jest.fn().mockReturnValue(false),
      };

      changeHandler(mockEvent);

      expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('pasteImage');
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
