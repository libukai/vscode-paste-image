import * as child_process from 'child_process';
import * as fs from 'fs-extra';
import { ClipboardManager } from '../clipboard';
import { Logger } from '../logger';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('../logger');

const mockChildProcess = child_process as jest.Mocked<typeof child_process>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ClipboardManager', () => {
  let clipboardManager: ClipboardManager;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
      configurable: true,
    });

    clipboardManager = new ClipboardManager(mockLogger);
  });

  describe('hasImage', () => {
    it('should return true when clipboard has image on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'public.png', '');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(true);
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('osascript'),
        expect.any(Function)
      );
    });

    it('should return false when clipboard has no image on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(false);
    });

    it('should return true when clipboard has image on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'True', '');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(true);
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('powershell'),
        expect.any(Function)
      );
    });

    it('should return false when clipboard has no image on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'False', '');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(false);
    });

    it('should return true when clipboard has image on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, 'image/png', '');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(true);
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('xclip'),
        expect.any(Function)
      );
    });

    it('should return false when clipboard has no image on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('No image in clipboard'), '', 'No image found');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(false);
    });

    it('should handle exec errors gracefully', async () => {
      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Command failed'), '', 'Error message');
        }
      }) as any;

      const result = await clipboardManager.hasImage();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to check clipboard'),
        expect.any(Error)
      );
    });

    it('should return false for unsupported platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'unsupported', configurable: true });

      const result = await clipboardManager.hasImage();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Unsupported platform'));
    });
  });

  describe('saveClipboardImageToFile', () => {
    beforeEach(() => {
      mockFs.ensureDir = jest.fn().mockResolvedValue(undefined);
    });

    it('should save image successfully on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(true);
      expect(result.imagePath).toBe('/test/path/image.png');
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('osascript'),
        expect.any(Function)
      );
    });

    it('should save image successfully on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(true);
      expect(result.imagePath).toBe('/test/path/image.png');
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('powershell'),
        expect.any(Function)
      );
    });

    it('should save image successfully on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(true);
      expect(result.imagePath).toBe('/test/path/image.png');
      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('xclip'),
        expect.any(Function)
      );
    });

    it('should handle save errors on macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('Save failed'), '', 'Error saving image');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Save failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save clipboard image'),
        expect.any(Error)
      );
    });

    it('should handle save errors on Windows', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('PowerShell error'), '', 'PowerShell execution failed');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('PowerShell error');
    });

    it('should handle save errors on Linux', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(new Error('xclip error'), '', 'xclip command failed');
        }
      }) as any;

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('xclip error');
    });

    it('should return error for unsupported platforms', async () => {
      Object.defineProperty(process, 'platform', { value: 'unsupported', configurable: true });

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported platform');
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Unsupported platform'));
    });

    it('should create directory before saving', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      await clipboardManager.saveClipboardImageToFile('/test/nested/path/image.png');

      expect(mockFs.ensureDir).toHaveBeenCalledWith('/test/nested/path');
    });

    it('should handle directory creation errors', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockFs.ensureDir = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const result = await clipboardManager.saveClipboardImageToFile('/test/path/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create directory');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create directory'),
        expect.any(Error)
      );
    });

    it('should escape file paths with spaces', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      await clipboardManager.saveClipboardImageToFile('/test/path with spaces/image.png');

      expect(mockChildProcess.exec).toHaveBeenCalledWith(
        expect.stringContaining('"/test/path with spaces/image.png"'),
        expect.any(Function)
      );
    });
  });

  describe('platform-specific command generation', () => {
    it('should generate correct macOS commands', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      await clipboardManager.hasImage();
      await clipboardManager.saveClipboardImageToFile('/test/image.png');

      const calls = (mockChildProcess.exec as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('osascript');
      expect(calls[0][0]).toContain('clipboard info');
      expect(calls[1][0]).toContain('osascript');
      expect(calls[1][0]).toContain('write clipboard');
    });

    it('should generate correct Windows commands', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      await clipboardManager.hasImage();
      await clipboardManager.saveClipboardImageToFile('/test/image.png');

      const calls = (mockChildProcess.exec as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('powershell');
      expect(calls[0][0]).toContain('Get-Clipboard');
      expect(calls[1][0]).toContain('powershell');
      expect(calls[1][0]).toContain('SaveAs');
    });

    it('should generate correct Linux commands', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });

      mockChildProcess.exec = jest.fn().mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, '', '');
        }
      }) as any;

      await clipboardManager.hasImage();
      await clipboardManager.saveClipboardImageToFile('/test/image.png');

      const calls = (mockChildProcess.exec as jest.Mock).mock.calls;
      expect(calls[0][0]).toContain('xclip');
      expect(calls[0][0]).toContain('-selection clipboard -t TARGETS -o');
      expect(calls[1][0]).toContain('xclip');
      expect(calls[1][0]).toContain('-selection clipboard -t image/png -o');
    });
  });
});
