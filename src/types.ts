/**
 * Configuration interface for the Paste Image extension
 */
export interface PasteImageConfig {
  readonly path: string;
  readonly basePath: string;
  readonly forceUnixStyleSeparator: boolean;
  readonly prefix: string;
  readonly suffix: string;
  readonly defaultName: string;
  readonly namePrefix: string;
  readonly nameSuffix: string;
  readonly encodePath: 'none' | 'urlEncode' | 'urlEncodeSpace';
  readonly insertPattern: string;
  readonly showFilePathConfirmInputBox: boolean;
  readonly filePathConfirmInputBoxMode: 'fullPath' | 'onlyName';
  readonly imageFormat: 'png' | 'jpg' | 'webp';
  readonly jpegQuality: number;
  readonly wechat: WeChatConfig;
}

/**
 * Supported image formats
 */
export type ImageFormat = 'png' | 'jpg' | 'webp';

/**
 * Path encoding options
 */
export type PathEncoding = 'none' | 'urlEncode' | 'urlEncodeSpace';

/**
 * Input box modes for file path confirmation
 */
export type InputBoxMode = 'fullPath' | 'onlyName';

/**
 * Language-specific image syntax
 */
export interface ImageSyntax {
  readonly prefix: string;
  readonly suffix: string;
}

/**
 * Variable substitution context
 */
export interface VariableContext {
  readonly currentFileDir: string;
  readonly workspaceRoot: string;
  readonly currentFileName: string;
  readonly currentFileNameWithoutExt: string;
  readonly imageFilePath: string;
  readonly imageOriginalFilePath: string;
  readonly imageFileName: string;
  readonly imageFileNameWithoutExt: string;
  readonly imageSyntaxPrefix: string;
  readonly imageSyntaxSuffix: string;
}

/**
 * Image processing result
 */
export interface ImageProcessResult {
  readonly success: boolean;
  readonly filePath?: string;
  readonly error?: string;
}

/**
 * Clipboard content type
 */
export type ClipboardContentType = 'image' | 'none' | 'text';

/**
 * Error types for better error handling
 */
export class PasteImageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PasteImageError';
  }
}

/**
 * Error codes for different types of failures
 */
export const ERROR_CODES = {
  NO_ACTIVE_EDITOR: 'NO_ACTIVE_EDITOR',
  UNSAVED_FILE: 'UNSAVED_FILE',
  INVALID_FILENAME: 'INVALID_FILENAME',
  NO_IMAGE_IN_CLIPBOARD: 'NO_IMAGE_IN_CLIPBOARD',
  FILE_ALREADY_EXISTS: 'FILE_ALREADY_EXISTS',
  SAVE_FAILED: 'SAVE_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  CLIPBOARD_ACCESS_FAILED: 'CLIPBOARD_ACCESS_FAILED',
  WECHAT_AUTH_FAILED: 'WECHAT_AUTH_FAILED',
  WECHAT_UPLOAD_FAILED: 'WECHAT_UPLOAD_FAILED',
  WECHAT_CONFIG_INVALID: 'WECHAT_CONFIG_INVALID',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * WeChat API configuration
 */
export interface WeChatConfig {
  readonly enabled: boolean;
  readonly appId: string;
  readonly appSecret: string;
  readonly baseUrl: string;
  readonly useStableToken: boolean;
}

/**
 * WeChat access token with expiration info
 */
export interface WeChatAccessToken {
  readonly access_token: string;
  readonly expires_in: number;
  readonly timestamp: number;
}

/**
 * WeChat material upload result
 */
export interface WeChatUploadResult {
  readonly success: boolean;
  readonly media_id?: string;
  readonly url?: string;
  readonly error?: string;
  readonly errcode?: number;
  readonly errmsg?: string;
}

/**
 * Generic WeChat API response structure
 */
export interface WeChatApiResponse {
  readonly errcode?: number;
  readonly errmsg?: string;
  readonly [key: string]: any;
}
