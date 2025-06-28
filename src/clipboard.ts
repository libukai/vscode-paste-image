import * as path from 'path';
import { spawn } from 'child_process';
import { ClipboardContentType, ImageProcessResult, PasteImageError, ERROR_CODES } from './types';
import { Logger } from './logger';

/**
 * Modern clipboard manager with cross-platform support
 */
export class ClipboardManager {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Check if clipboard contains an image
   */
  public async hasImage(): Promise<boolean> {
    try {
      const contentType = await this.getClipboardContentType();
      return contentType === 'image';
    } catch (error) {
      this.logger.error('Failed to check clipboard content', error as Error);
      return false;
    }
  }

  /**
   * Get the type of content in clipboard
   */
  public async getClipboardContentType(): Promise<ClipboardContentType> {
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        return this.getClipboardContentTypeMacOS();
      } else if (platform === 'win32') {
        return this.getClipboardContentTypeWindows();
      } else {
        return this.getClipboardContentTypeLinux();
      }
    } catch (error) {
      this.logger.error('Failed to determine clipboard content type', error as Error);
      throw new PasteImageError(
        'Failed to access clipboard',
        ERROR_CODES.CLIPBOARD_ACCESS_FAILED,
        error as Error
      );
    }
  }

  /**
   * Save clipboard image to file
   */
  public async saveClipboardImageToFile(imagePath: string): Promise<ImageProcessResult> {
    try {
      const hasImage = await this.hasImage();
      if (!hasImage) {
        return {
          success: false,
          error: 'No image found in clipboard',
        };
      }

      const platform = process.platform;
      let result: ImageProcessResult;

      if (platform === 'darwin') {
        result = await this.saveImageMacOS(imagePath);
      } else if (platform === 'win32') {
        result = await this.saveImageWindows(imagePath);
      } else {
        result = await this.saveImageLinux(imagePath);
      }

      if (result.success) {
        this.logger.info(`Successfully saved clipboard image to: ${imagePath}`);
      } else {
        this.logger.error(`Failed to save clipboard image: ${result.error}`);
      }

      return result;
    } catch (error) {
      const errorMessage = `Failed to save clipboard image: ${(error as Error).message}`;
      this.logger.error(errorMessage, error as Error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get clipboard content type on macOS
   */
  private async getClipboardContentTypeMacOS(): Promise<ClipboardContentType> {
    return new Promise((resolve, reject) => {
      const script = `
        set clipboardTypes to (clipboard info)
        repeat with typeInfo in clipboardTypes
          if (first item of typeInfo) is equal to «class PNGf» then
            return "image"
          end if
        end repeat
        return "none"
      `;

      const process = spawn('osascript', ['-e', script]);
      let output = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString().trim();
      });

      process.on('error', reject);
      process.on('close', code => {
        if (code === 0) {
          resolve(output === 'image' ? 'image' : 'none');
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Get clipboard content type on Windows
   */
  private async getClipboardContentTypeWindows(): Promise<ClipboardContentType> {
    return new Promise((resolve, reject) => {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
          Write-Output "image"
        } else {
          Write-Output "none"
        }
      `;

      const process = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-NoLogo',
        '-Command',
        script,
      ]);

      let output = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString().trim();
      });

      process.on('error', reject);
      process.on('close', code => {
        if (code === 0) {
          resolve(output === 'image' ? 'image' : 'none');
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Get clipboard content type on Linux
   */
  private async getClipboardContentTypeLinux(): Promise<ClipboardContentType> {
    return new Promise((resolve, reject) => {
      const process = spawn('xclip', ['-selection', 'clipboard', '-t', 'TARGETS', '-o']);
      let output = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      process.on('error', error => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          reject(
            new Error(
              'xclip is not installed. Please install xclip to use clipboard functionality.'
            )
          );
        } else {
          reject(error);
        }
      });

      process.on('close', code => {
        if (code === 0) {
          const hasImage = output.includes('image/png') || output.includes('image/jpeg');
          resolve(hasImage ? 'image' : 'none');
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Save image on macOS using AppleScript
   */
  private async saveImageMacOS(imagePath: string): Promise<ImageProcessResult> {
    return new Promise(resolve => {
      const scriptPath = path.join(__dirname, '../res/mac.applescript');
      const process = spawn('osascript', [scriptPath, imagePath]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString().trim();
      });

      process.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString().trim();
      });

      process.on('error', error => {
        resolve({
          success: false,
          error: `AppleScript execution failed: ${error.message}`,
        });
      });

      process.on('close', code => {
        if (code === 0 && output === imagePath) {
          resolve({
            success: true,
            filePath: imagePath,
          });
        } else if (output === 'no image') {
          resolve({
            success: false,
            error: 'No image found in clipboard',
          });
        } else {
          resolve({
            success: false,
            error: errorOutput || `Process exited with code ${code}`,
          });
        }
      });
    });
  }

  /**
   * Save image on Windows using PowerShell
   */
  private async saveImageWindows(imagePath: string): Promise<ImageProcessResult> {
    return new Promise(resolve => {
      const scriptPath = path.join(__dirname, '../res/pc.ps1');

      const process = spawn('powershell', [
        '-NoProfile',
        '-NonInteractive',
        '-NoLogo',
        '-ExecutionPolicy',
        'Unrestricted',
        '-File',
        scriptPath,
        imagePath,
      ]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString().trim();
      });

      process.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString().trim();
      });

      process.on('error', error => {
        resolve({
          success: false,
          error: `PowerShell execution failed: ${error.message}`,
        });
      });

      process.on('close', code => {
        if (code === 0 && output === imagePath) {
          resolve({
            success: true,
            filePath: imagePath,
          });
        } else if (output === 'no image') {
          resolve({
            success: false,
            error: 'No image found in clipboard',
          });
        } else {
          resolve({
            success: false,
            error: errorOutput || `Process exited with code ${code}`,
          });
        }
      });
    });
  }

  /**
   * Save image on Linux using xclip
   */
  private async saveImageLinux(imagePath: string): Promise<ImageProcessResult> {
    return new Promise(resolve => {
      const scriptPath = path.join(__dirname, '../res/linux.sh');
      const process = spawn('sh', [scriptPath, imagePath]);

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data: Buffer) => {
        output += data.toString().trim();
      });

      process.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString().trim();
      });

      process.on('error', error => {
        resolve({
          success: false,
          error: `Script execution failed: ${error.message}`,
        });
      });

      process.on('close', code => {
        if (code === 0) {
          if (output === 'no xclip') {
            resolve({
              success: false,
              error: 'xclip is not installed. Please install xclip to use clipboard functionality.',
            });
          } else if (output === 'no image') {
            resolve({
              success: false,
              error: 'No image found in clipboard',
            });
          } else if (output === imagePath) {
            resolve({
              success: true,
              filePath: imagePath,
            });
          } else {
            resolve({
              success: false,
              error: `Unexpected output: ${output}`,
            });
          }
        } else {
          resolve({
            success: false,
            error: errorOutput || `Process exited with code ${code}`,
          });
        }
      });
    });
  }
}
