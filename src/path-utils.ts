import * as path from 'path';
import * as vscode from 'vscode';
import { format } from 'date-fns';
import { PasteImageConfig, VariableContext, ImageSyntax, PathEncoding } from './types';

/**
 * Utility class for path manipulation and variable substitution
 */
export class PathUtils {
  private static readonly PATH_VARIABLE_PATTERNS = {
    currentFileDir: /\$\{currentFileDir\}/g,
    workspaceRoot: /\$\{workspaceRoot\}/g,
    currentFileName: /\$\{currentFileName\}/g,
    currentFileNameWithoutExt: /\$\{currentFileNameWithoutExt\}/g,
    imageFilePath: /\$\{imageFilePath\}/g,
    imageOriginalFilePath: /\$\{imageOriginalFilePath\}/g,
    imageFileName: /\$\{imageFileName\}/g,
    imageFileNameWithoutExt: /\$\{imageFileNameWithoutExt\}/g,
    imageSyntaxPrefix: /\$\{imageSyntaxPrefix\}/g,
    imageSyntaxSuffix: /\$\{imageSyntaxSuffix\}/g,
  } as const;

  /**
   * Create variable context from current editor and workspace
   */
  public static createVariableContext(
    editor: vscode.TextEditor,
    imageFilePath?: string
  ): VariableContext {
    const currentFilePath = editor.document.uri.fsPath;
    const currentFileDir = path.dirname(currentFilePath);
    const currentFileName = path.basename(currentFilePath);
    const currentFileExt = path.extname(currentFilePath);
    const currentFileNameWithoutExt = path.basename(currentFilePath, currentFileExt);

    // Get workspace root
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    const workspaceRoot = workspaceFolder?.uri.fsPath ?? currentFileDir;

    // Image file information (if provided)
    const imageFileName = imageFilePath ? path.basename(imageFilePath) : '';
    const imageFileExt = imageFilePath ? path.extname(imageFilePath) : '';
    const imageFileNameWithoutExt = imageFilePath ? path.basename(imageFilePath, imageFileExt) : '';

    // Language-specific syntax
    const imageSyntax = this.getImageSyntax(editor.document.languageId);

    return {
      currentFileDir,
      workspaceRoot,
      currentFileName,
      currentFileNameWithoutExt,
      imageFilePath: imageFilePath ?? '',
      imageOriginalFilePath: imageFilePath ?? '',
      imageFileName,
      imageFileNameWithoutExt,
      imageSyntaxPrefix: imageSyntax.prefix,
      imageSyntaxSuffix: imageSyntax.suffix,
    };
  }

  /**
   * Replace variables in a string using the provided context
   */
  public static replaceVariables(
    template: string,
    context: VariableContext,
    postProcessor?: (value: string) => string
  ): string {
    let result = template;

    // Apply post-processor if provided (used for date formatting)
    const processor = postProcessor ?? ((x: string) => x);

    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.currentFileDir,
      processor(context.currentFileDir)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.workspaceRoot,
      processor(context.workspaceRoot)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.currentFileName,
      processor(context.currentFileName)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.currentFileNameWithoutExt,
      processor(context.currentFileNameWithoutExt)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageFilePath,
      processor(context.imageFilePath)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageOriginalFilePath,
      processor(context.imageOriginalFilePath)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageFileName,
      processor(context.imageFileName)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageFileNameWithoutExt,
      processor(context.imageFileNameWithoutExt)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageSyntaxPrefix,
      processor(context.imageSyntaxPrefix)
    );
    result = result.replace(
      this.PATH_VARIABLE_PATTERNS.imageSyntaxSuffix,
      processor(context.imageSyntaxSuffix)
    );

    return result;
  }

  /**
   * Generate a filename using the default name pattern
   */
  public static generateFileName(
    config: PasteImageConfig,
    context: VariableContext,
    selectedText?: string
  ): string {
    let fileName: string;

    if (selectedText && this.isValidFileName(selectedText)) {
      fileName = selectedText;
    } else {
      // Use date formatting instead of moment.js
      const now = new Date();
      fileName = format(now, config.defaultName);
    }

    // Apply prefix and suffix
    const fullFileName = `${config.namePrefix}${fileName}${config.nameSuffix}.${config.imageFormat}`;

    return this.replaceVariables(fullFileName, context);
  }

  /**
   * Validate if a string is a valid filename
   */
  public static isValidFileName(fileName: string): boolean {
    // Check for invalid characters in Windows/Unix
    const invalidChars = /[\\/:*?"<>|]/;
    return !invalidChars.test(fileName) && fileName.trim().length > 0;
  }

  /**
   * Resolve the full image path
   */
  public static resolveImagePath(
    fileName: string,
    config: PasteImageConfig,
    context: VariableContext
  ): string {
    const resolvedPath = this.replaceVariables(config.path, context);

    let fullPath: string;
    if (path.isAbsolute(resolvedPath)) {
      fullPath = path.join(resolvedPath, fileName);
    } else {
      fullPath = path.join(context.currentFileDir, resolvedPath, fileName);
    }

    return path.normalize(fullPath);
  }

  /**
   * Process the image path for insertion into the document
   */
  public static processImagePathForInsertion(
    imagePath: string,
    config: PasteImageConfig,
    context: VariableContext
  ): string {
    let processedPath = imagePath;

    // Calculate relative path if basePath is specified
    if (config.basePath.trim()) {
      const resolvedBasePath = this.replaceVariables(config.basePath, context);
      processedPath = path.relative(resolvedBasePath, imagePath);
    }

    // Force Unix-style separators if configured
    if (config.forceUnixStyleSeparator) {
      processedPath = processedPath.replace(/\\/g, '/');
    }

    // Apply prefix and suffix
    processedPath = `${config.prefix}${processedPath}${config.suffix}`;

    // Apply path encoding
    processedPath = this.encodePath(processedPath, config.encodePath);

    return processedPath;
  }

  /**
   * Generate the final insert pattern
   */
  public static generateInsertPattern(
    processedImagePath: string,
    config: PasteImageConfig,
    context: VariableContext
  ): string {
    // Create context with the processed image path
    const insertContext: VariableContext = {
      ...context,
      imageFilePath: processedImagePath,
    };

    return this.replaceVariables(config.insertPattern, insertContext);
  }

  /**
   * Get language-specific image syntax
   */
  public static getImageSyntax(languageId: string): ImageSyntax {
    switch (languageId) {
      case 'markdown':
        return { prefix: '![](', suffix: ')' };
      case 'asciidoc':
        return { prefix: 'image::', suffix: '[]' };
      case 'restructuredtext':
        return { prefix: '.. image:: ', suffix: '' };
      case 'org':
        return { prefix: '[[', suffix: ']]' };
      default:
        return { prefix: '', suffix: '' };
    }
  }

  /**
   * Encode path according to the specified encoding
   */
  private static encodePath(filePath: string, encoding: PathEncoding): string {
    switch (encoding) {
      case 'urlEncode':
        return encodeURI(filePath);
      case 'urlEncodeSpace':
        return filePath.replace(/ /g, '%20');
      case 'none':
      default:
        return filePath;
    }
  }

  /**
   * Normalize path separators based on OS and configuration
   */
  public static normalizePath(filePath: string, forceUnixStyle: boolean): string {
    if (forceUnixStyle) {
      return filePath.replace(/\\/g, '/');
    }
    return path.normalize(filePath);
  }

  /**
   * Check if a file path is within the workspace
   */
  public static isPathInWorkspace(filePath: string, workspaceRoot: string): boolean {
    const normalizedFilePath = path.normalize(filePath);
    const normalizedWorkspaceRoot = path.normalize(workspaceRoot);
    return normalizedFilePath.startsWith(normalizedWorkspaceRoot);
  }
}
