import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PasteImageConfig, PasteImageError, ERROR_CODES } from './types';
import { Logger } from './logger';
import { ClipboardManager } from './clipboard';
import { PathUtils } from './path-utils';

/**
 * Main image processing class that orchestrates the paste operation
 */
export class ImageProcessor {
  private readonly logger: Logger;
  private readonly clipboardManager: ClipboardManager;

  constructor(logger: Logger, clipboardManager: ClipboardManager) {
    this.logger = logger;
    this.clipboardManager = clipboardManager;
  }

  /**
   * Main entry point for pasting an image from clipboard
   */
  public async pasteImage(config: PasteImageConfig): Promise<void> {
    try {
      // Get active editor
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        throw new PasteImageError('No active text editor found', ERROR_CODES.NO_ACTIVE_EDITOR);
      }

      // Check if file is saved
      if (editor.document.uri.scheme === 'untitled') {
        throw new PasteImageError(
          'Please save the current file before pasting an image',
          ERROR_CODES.UNSAVED_FILE
        );
      }

      // Check clipboard content
      const hasImage = await this.clipboardManager.hasImage();
      if (!hasImage) {
        throw new PasteImageError('No image found in clipboard', ERROR_CODES.NO_IMAGE_IN_CLIPBOARD);
      }

      // Get selected text for filename
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      // Validate selected text as filename
      if (selectedText && !PathUtils.isValidFileName(selectedText)) {
        throw new PasteImageError(
          'Selected text contains invalid filename characters',
          ERROR_CODES.INVALID_FILENAME
        );
      }

      // Create variable context
      const context = PathUtils.createVariableContext(editor);

      // Generate filename
      const fileName = PathUtils.generateFileName(config, context, selectedText);

      // Resolve full image path
      const imagePath = PathUtils.resolveImagePath(fileName, config, context);

      // Handle file path confirmation if enabled
      const finalImagePath = config.showFilePathConfirmInputBox
        ? await this.confirmFilePath(imagePath, config)
        : imagePath;

      if (!finalImagePath) {
        this.logger.info('Image paste operation cancelled by user');
        return;
      }

      // Check if file already exists
      const fileExists = await fs.pathExists(finalImagePath);
      if (fileExists) {
        const shouldReplace = await this.confirmFileReplace(finalImagePath);
        if (!shouldReplace) {
          this.logger.info('Image paste operation cancelled - file already exists');
          return;
        }
      }

      // Create directory if it doesn't exist
      await this.ensureDirectoryExists(finalImagePath);

      // Save image from clipboard
      const saveResult = await this.clipboardManager.saveClipboardImageToFile(finalImagePath);
      if (!saveResult.success) {
        throw new PasteImageError(
          saveResult.error ?? 'Failed to save image',
          ERROR_CODES.SAVE_FAILED
        );
      }

      // Update context with actual image path
      const updatedContext = PathUtils.createVariableContext(editor, finalImagePath);

      // Process image path for insertion
      const processedPath = PathUtils.processImagePathForInsertion(
        finalImagePath,
        config,
        updatedContext
      );

      // Generate insert pattern
      const insertText = PathUtils.generateInsertPattern(processedPath, config, updatedContext);

      // Insert into editor
      await this.insertTextIntoEditor(editor, insertText, selection);

      this.logger.info(`Successfully pasted image: ${finalImagePath}`);
    } catch (error) {
      if (error instanceof PasteImageError) {
        await this.logger.showErrorMessage(error.message);
      } else {
        const errorMessage = `Unexpected error during image paste: ${(error as Error).message}`;
        await this.logger.showErrorMessage(errorMessage, error as Error);
      }
      throw error;
    }
  }

  /**
   * Ensure the directory exists for the image file
   */
  private async ensureDirectoryExists(imagePath: string): Promise<void> {
    try {
      const imageDir = path.dirname(imagePath);
      const stats = await fs.stat(imageDir).catch(() => null);

      if (stats === null) {
        // Directory doesn't exist, create it
        await fs.ensureDir(imageDir);
        this.logger.debug(`Created directory: ${imageDir}`);
      } else if (!stats.isDirectory()) {
        // Path exists but is not a directory
        throw new PasteImageError(
          `The destination path '${imageDir}' exists but is not a directory`,
          ERROR_CODES.INVALID_CONFIG
        );
      }
    } catch (error) {
      if (error instanceof PasteImageError) {
        throw error;
      }
      throw new PasteImageError(
        `Failed to create directory for image: ${(error as Error).message}`,
        ERROR_CODES.SAVE_FAILED,
        error as Error
      );
    }
  }

  /**
   * Show confirmation dialog for file path
   */
  private async confirmFilePath(
    defaultPath: string,
    config: PasteImageConfig
  ): Promise<string | undefined> {
    const { filePathConfirmInputBoxMode: mode, imageFormat } = config;
    const prompt = 'Please specify the filename of the image:';
    const defaultValue = mode === 'fullPath' ? defaultPath : path.basename(defaultPath);

    const result = await vscode.window.showInputBox({
      prompt,
      value: defaultValue,
      placeHolder: 'Enter filename or full path',
    });

    if (!result) {
      return undefined;
    }

    let finalPath = result;

    // Add extension if not present
    const hasExtension = path.extname(result).length > 0;
    if (!hasExtension) {
      finalPath = `${result}.${imageFormat}`;
    }

    // If only name mode, combine with directory from original path
    if (mode === 'onlyName') {
      const originalDir = path.dirname(defaultPath);
      finalPath = path.join(originalDir, finalPath);
    }

    return finalPath;
  }

  /**
   * Show confirmation dialog for file replacement
   */
  private async confirmFileReplace(filePath: string): Promise<boolean> {
    const fileName = path.basename(filePath);
    const choice = await vscode.window.showWarningMessage(
      `File '${fileName}' already exists. Do you want to replace it?`,
      'Replace',
      'Cancel'
    );

    return choice === 'Replace';
  }

  /**
   * Insert text into the editor
   */
  private async insertTextIntoEditor(
    editor: vscode.TextEditor,
    text: string,
    selection: vscode.Selection
  ): Promise<void> {
    await editor.edit(editBuilder => {
      if (selection.isEmpty) {
        editBuilder.insert(selection.start, text);
      } else {
        editBuilder.replace(selection, text);
      }
    });
  }
}
