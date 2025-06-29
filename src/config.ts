import * as vscode from 'vscode';
import { PasteImageConfig, PasteImageError, ERROR_CODES, WeChatConfig } from './types';
import { Logger } from './logger';

/**
 * Configuration manager for the Paste Image extension
 * Provides type-safe access to extension settings
 */
export class ConfigManager {
  private static readonly CONFIG_SECTION = 'pasteImage';

  /**
   * Get the current configuration with proper defaults and validation
   */
  public static getConfig(): PasteImageConfig {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);

    const pasteImageConfig: PasteImageConfig = {
      path: this.getStringConfig(config, 'path', '${currentFileDir}'),
      basePath: this.getStringConfig(config, 'basePath', '${currentFileDir}'),
      forceUnixStyleSeparator: this.getBooleanConfig(config, 'forceUnixStyleSeparator', true),
      prefix: this.getStringConfig(config, 'prefix', ''),
      suffix: this.getStringConfig(config, 'suffix', ''),
      defaultName: this.getStringConfig(config, 'defaultName', 'yyyy-MM-dd-HH-mm-ss'),
      namePrefix: this.getStringConfig(config, 'namePrefix', ''),
      nameSuffix: this.getStringConfig(config, 'nameSuffix', ''),
      encodePath: this.getEnumConfig(config, 'encodePath', 'urlEncodeSpace', [
        'none',
        'urlEncode',
        'urlEncodeSpace',
      ]),
      insertPattern: this.getStringConfig(
        config,
        'insertPattern',
        '${imageSyntaxPrefix}${imageFilePath}${imageSyntaxSuffix}'
      ),
      showFilePathConfirmInputBox: this.getBooleanConfig(
        config,
        'showFilePathConfirmInputBox',
        false
      ),
      filePathConfirmInputBoxMode: this.getEnumConfig(
        config,
        'filePathConfirmInputBoxMode',
        'fullPath',
        ['fullPath', 'onlyName']
      ),
      imageFormat: this.getEnumConfig(config, 'imageFormat', 'png', ['png', 'jpg', 'webp']),
      jpegQuality: this.getNumberConfig(config, 'jpegQuality', 85, 1, 100),
      wechat: this.getWeChatConfig(config),
    };

    this.validateConfig(pasteImageConfig);
    return pasteImageConfig;
  }

  /**
   * Validate configuration values
   */
  private static validateConfig(config: PasteImageConfig): void {
    // Validate path configuration
    if (config.path.length !== config.path.trim().length) {
      throw new PasteImageError(
        `Invalid path configuration: '${config.path}' contains leading/trailing spaces`,
        ERROR_CODES.INVALID_CONFIG
      );
    }

    if (config.basePath.length !== config.basePath.trim().length) {
      throw new PasteImageError(
        `Invalid basePath configuration: '${config.basePath}' contains leading/trailing spaces`,
        ERROR_CODES.INVALID_CONFIG
      );
    }

    // Validate default name pattern
    if (!config.defaultName.trim()) {
      throw new PasteImageError('Default name pattern cannot be empty', ERROR_CODES.INVALID_CONFIG);
    }
  }

  /**
   * Get string configuration value with validation
   */
  private static getStringConfig(
    config: vscode.WorkspaceConfiguration,
    key: string,
    defaultValue: string
  ): string {
    const value = config.get<string>(key, defaultValue);
    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Get boolean configuration value with validation
   */
  private static getBooleanConfig(
    config: vscode.WorkspaceConfiguration,
    key: string,
    defaultValue: boolean
  ): boolean {
    const value = config.get<boolean>(key, defaultValue);
    return typeof value === 'boolean' ? value : defaultValue;
  }

  /**
   * Get number configuration value with validation and range check
   */
  private static getNumberConfig(
    config: vscode.WorkspaceConfiguration,
    key: string,
    defaultValue: number,
    min?: number,
    max?: number
  ): number {
    const value = config.get<number>(key, defaultValue);
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return defaultValue;
    }

    if (min !== undefined && value < min) {
      return min;
    }

    if (max !== undefined && value > max) {
      return max;
    }

    return value;
  }

  /**
   * Get enum configuration value with validation
   */
  private static getEnumConfig<T extends string>(
    config: vscode.WorkspaceConfiguration,
    key: string,
    defaultValue: T,
    allowedValues: readonly T[]
  ): T {
    const value = config.get<T>(key, defaultValue);
    return allowedValues.includes(value) ? value : defaultValue;
  }

  /**
   * Watch for configuration changes
   */
  public static onConfigurationChanged(
    callback: (config: PasteImageConfig) => void,
    logger: Logger
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration(this.CONFIG_SECTION)) {
        try {
          const newConfig = this.getConfig();
          callback(newConfig);
        } catch (error) {
          // Log error but don't crash the extension
          logger.error('Failed to load new configuration', error as Error);
        }
      }
    });
  }

  /**
   * Get WeChat configuration with validation
   */
  private static getWeChatConfig(config: vscode.WorkspaceConfiguration): WeChatConfig {
    return {
      enabled: this.getBooleanConfig(config, 'wechat.enabled', false),
      appId: this.getStringConfig(config, 'wechat.appId', ''),
      appSecret: this.getStringConfig(config, 'wechat.appSecret', ''),
      baseUrl: this.getStringConfig(config, 'wechat.baseUrl', 'https://api.weixin.qq.com'),
      useStableToken: this.getBooleanConfig(config, 'wechat.useStableToken', true),
    };
  }
}
