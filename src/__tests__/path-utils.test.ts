import * as os from 'os';
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

    it('should expand home directory paths', () => {
      const homeDir = os.homedir();
      const template1 = '~/Documents/images';
      const result1 = PathUtils.replaceVariables(template1, mockContext);
      expect(result1).toBe(`${homeDir}/Documents/images`);

      const template2 = '~';
      const result2 = PathUtils.replaceVariables(template2, mockContext);
      expect(result2).toBe(homeDir);

      const template3 = '/absolute/path';
      const result3 = PathUtils.replaceVariables(template3, mockContext);
      expect(result3).toBe('/absolute/path');
    });
  });

  describe('expandHomeDirectory', () => {
    it('should expand ~ to home directory', () => {
      const homeDir = os.homedir();
      expect(PathUtils.expandHomeDirectory('~')).toBe(homeDir);
      expect(PathUtils.expandHomeDirectory('~/Documents')).toBe(`${homeDir}/Documents`);
      expect(PathUtils.expandHomeDirectory('~/Documents/images/test.png')).toBe(
        `${homeDir}/Documents/images/test.png`
      );
    });

    it('should not modify non-home paths', () => {
      expect(PathUtils.expandHomeDirectory('/absolute/path')).toBe('/absolute/path');
      expect(PathUtils.expandHomeDirectory('relative/path')).toBe('relative/path');
      expect(PathUtils.expandHomeDirectory('./current/path')).toBe('./current/path');
      expect(PathUtils.expandHomeDirectory('../parent/path')).toBe('../parent/path');
    });
  });

  describe('isValidFileName', () => {
    it('should return true for valid filenames', () => {
      expect(PathUtils.isValidFileName('test.png')).toBe(true);
      expect(PathUtils.isValidFileName('image-2023')).toBe(true);
      expect(PathUtils.isValidFileName('file_name')).toBe(true);
      expect(PathUtils.isValidFileName('valid-file-123')).toBe(true);
    });

    it('should return false for invalid characters', () => {
      expect(PathUtils.isValidFileName('test:file')).toBe(false);
      expect(PathUtils.isValidFileName('test*file')).toBe(false);
      expect(PathUtils.isValidFileName('test?file')).toBe(false);
      expect(PathUtils.isValidFileName('test<file')).toBe(false);
      expect(PathUtils.isValidFileName('test>file')).toBe(false);
      expect(PathUtils.isValidFileName('test|file')).toBe(false);
      expect(PathUtils.isValidFileName('test\\file')).toBe(false);
      expect(PathUtils.isValidFileName('test/file')).toBe(false);
      expect(PathUtils.isValidFileName('test"file')).toBe(false);
    });

    it('should return false for empty or whitespace-only names', () => {
      expect(PathUtils.isValidFileName('')).toBe(false);
      expect(PathUtils.isValidFileName('   ')).toBe(false);
      expect(PathUtils.isValidFileName('\t')).toBe(false);
    });

    it('should return false for Windows reserved names', () => {
      expect(PathUtils.isValidFileName('CON')).toBe(false);
      expect(PathUtils.isValidFileName('con')).toBe(false);
      expect(PathUtils.isValidFileName('PRN')).toBe(false);
      expect(PathUtils.isValidFileName('AUX')).toBe(false);
      expect(PathUtils.isValidFileName('NUL')).toBe(false);
      expect(PathUtils.isValidFileName('COM1')).toBe(false);
      expect(PathUtils.isValidFileName('COM9')).toBe(false);
      expect(PathUtils.isValidFileName('LPT1')).toBe(false);
      expect(PathUtils.isValidFileName('LPT9')).toBe(false);
      expect(PathUtils.isValidFileName('CON.txt')).toBe(false);
      expect(PathUtils.isValidFileName('con.png')).toBe(false);
    });

    it('should return false for names ending with dot or space', () => {
      expect(PathUtils.isValidFileName('filename.')).toBe(false);
      expect(PathUtils.isValidFileName('filename ')).toBe(false);
      expect(PathUtils.isValidFileName('test.png.')).toBe(false);
      expect(PathUtils.isValidFileName('test.png ')).toBe(false);
    });

    it('should return false for names starting with dot', () => {
      expect(PathUtils.isValidFileName('.hidden')).toBe(false);
      expect(PathUtils.isValidFileName('.gitignore')).toBe(false);
      expect(PathUtils.isValidFileName('.test.png')).toBe(false);
    });

    it('should return false for excessively long filenames', () => {
      const longName = 'a'.repeat(256);
      expect(PathUtils.isValidFileName(longName)).toBe(false);

      const maxValidName = 'a'.repeat(255);
      expect(PathUtils.isValidFileName(maxValidName)).toBe(true);
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
