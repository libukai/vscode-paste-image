import { PathUtils } from '../path-utils';
import { VariableContext } from '../types';

describe('PathUtils', () => {
  const mockContext: VariableContext = {
    currentFileDir: '/workspace/docs',
    workspaceRoot: '/workspace',
    currentFileName: 'README.md',
    currentFileNameWithoutExt: 'README',
    imageFilePath: '/workspace/docs/images/test.png',
    imageOriginalFilePath: '/workspace/docs/images/test.png',
    imageFileName: 'test.png',
    imageFileNameWithoutExt: 'test',
    imageSyntaxPrefix: '![](',
    imageSyntaxSuffix: ')',
  };

  describe('replaceVariables', () => {
    it('should replace all variables correctly', () => {
      const template = '${currentFileDir}/${imageFileName}';
      const result = PathUtils.replaceVariables(template, mockContext);
      expect(result).toBe('/workspace/docs/test.png');
    });

    it('should apply post-processor to variables', () => {
      const template = '${currentFileDir}';
      const postProcessor = (value: string) => value.toUpperCase();
      const result = PathUtils.replaceVariables(template, mockContext, postProcessor);
      expect(result).toBe('/WORKSPACE/DOCS');
    });

    it('should handle missing variables gracefully', () => {
      const template = '${nonExistentVariable}';
      const result = PathUtils.replaceVariables(template, mockContext);
      expect(result).toBe('${nonExistentVariable}');
    });
  });

  describe('isValidFileName', () => {
    it('should return true for valid filenames', () => {
      expect(PathUtils.isValidFileName('test.png')).toBe(true);
      expect(PathUtils.isValidFileName('image-2023')).toBe(true);
      expect(PathUtils.isValidFileName('file_name')).toBe(true);
    });

    it('should return false for invalid filenames', () => {
      expect(PathUtils.isValidFileName('test:file')).toBe(false);
      expect(PathUtils.isValidFileName('test*file')).toBe(false);
      expect(PathUtils.isValidFileName('test?file')).toBe(false);
      expect(PathUtils.isValidFileName('test<file')).toBe(false);
      expect(PathUtils.isValidFileName('test>file')).toBe(false);
      expect(PathUtils.isValidFileName('test|file')).toBe(false);
      expect(PathUtils.isValidFileName('')).toBe(false);
      expect(PathUtils.isValidFileName('   ')).toBe(false);
    });
  });

  describe('getImageSyntax', () => {
    it('should return correct syntax for markdown', () => {
      const syntax = PathUtils.getImageSyntax('markdown');
      expect(syntax.prefix).toBe('![](');
      expect(syntax.suffix).toBe(')');
    });

    it('should return correct syntax for asciidoc', () => {
      const syntax = PathUtils.getImageSyntax('asciidoc');
      expect(syntax.prefix).toBe('image::');
      expect(syntax.suffix).toBe('[]');
    });

    it('should return empty syntax for unknown languages', () => {
      const syntax = PathUtils.getImageSyntax('unknown');
      expect(syntax.prefix).toBe('');
      expect(syntax.suffix).toBe('');
    });
  });

  describe('processImagePathForInsertion', () => {
    const config = {
      basePath: '${currentFileDir}',
      forceUnixStyleSeparator: true,
      prefix: '',
      suffix: '',
      encodePath: 'urlEncodeSpace' as const,
      path: '',
      defaultName: '',
      namePrefix: '',
      nameSuffix: '',
      insertPattern: '',
      showFilePathConfirmInputBox: false,
      filePathConfirmInputBoxMode: 'fullPath' as const,
      imageFormat: 'png' as const,
      jpegQuality: 85,
    };

    it('should process relative paths correctly', () => {
      const imagePath = '/workspace/docs/images/test.png';
      const result = PathUtils.processImagePathForInsertion(imagePath, config, mockContext);
      expect(result).toBe('images/test.png');
    });

    it('should handle spaces in paths', () => {
      const imagePathWithSpaces = '/workspace/docs/images/test image.png';
      const result = PathUtils.processImagePathForInsertion(
        imagePathWithSpaces,
        config,
        mockContext
      );
      expect(result).toBe('images/test%20image.png');
    });

    it('should apply prefix and suffix', () => {
      const configWithPrefixSuffix = { ...config, prefix: './', suffix: '?v=1' };
      const imagePath = '/workspace/docs/images/test.png';
      const result = PathUtils.processImagePathForInsertion(
        imagePath,
        configWithPrefixSuffix,
        mockContext
      );
      expect(result).toBe('./images/test.png?v=1');
    });
  });

  describe('generateInsertPattern', () => {
    const config = {
      basePath: '${currentFileDir}',
      forceUnixStyleSeparator: true,
      prefix: '',
      suffix: '',
      encodePath: 'urlEncodeSpace' as const,
      path: '',
      defaultName: '',
      namePrefix: '',
      nameSuffix: '',
      insertPattern: '${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}',
      showFilePathConfirmInputBox: false,
      filePathConfirmInputBoxMode: 'fullPath' as const,
      imageFormat: 'png' as const,
      jpegQuality: 85,
    };

    it('should generate default Markdown pattern', () => {
      const processedPath = 'images/test.png';
      const result = PathUtils.generateInsertPattern(processedPath, config, mockContext);
      expect(result).toBe('![](images/test.png)');
    });

    it('should use custom insert pattern', () => {
      const customConfig = {
        ...config,
        insertPattern: '<img src="${imageFilePath}" alt="${imageFileNameWithoutExt}" />',
      };
      const processedPath = 'images/test.png';
      const result = PathUtils.generateInsertPattern(processedPath, customConfig, mockContext);
      expect(result).toBe('<img src="images/test.png" alt="test" />');
    });

    it('should replace all available variables in pattern', () => {
      const customConfig = {
        ...config,
        insertPattern:
          '${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix} <!-- ${imageFileName} -->',
      };
      const processedPath = 'images/test.png';
      const result = PathUtils.generateInsertPattern(processedPath, customConfig, mockContext);
      expect(result).toBe('![](images/test.png) <!-- test.png -->');
    });
  });

  describe('normalizePath', () => {
    it('should force Unix-style separators when configured', () => {
      const windowsPath = 'images\\subfolder\\test.png';
      const result = PathUtils.normalizePath(windowsPath, true);
      expect(result).toBe('images/subfolder/test.png');
    });

    it('should preserve OS separators when not forced', () => {
      const windowsPath = 'images\\subfolder\\test.png';
      const result = PathUtils.normalizePath(windowsPath, false);
      // Result depends on OS, but should be normalized
      expect(result).toContain('test.png');
    });
  });
});
