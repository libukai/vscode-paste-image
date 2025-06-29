import * as https from 'https';
import * as fs from 'fs-extra';
import FormData from 'form-data';
import {
  WeChatConfig,
  WeChatAccessToken,
  WeChatUploadResult,
  WeChatApiResponse,
  PasteImageError,
  ERROR_CODES,
} from './types';
import { Logger } from './logger';

/**
 * WeChat API service for managing access tokens and uploading materials
 */
export class WeChatApiService {
  private logger: Logger;
  private cachedToken: WeChatAccessToken | null = null;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get access token (with caching)
   */
  public async getAccessToken(config: WeChatConfig): Promise<string> {
    this.validateConfig(config);

    // Check if cached token is still valid
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      this.logger.debug('Using cached access token');
      return this.cachedToken.access_token;
    }

    this.logger.debug('Fetching new access token');

    try {
      if (config.useStableToken) {
        this.cachedToken = await this.getStableAccessToken(config);
      } else {
        this.cachedToken = await this.getRegularAccessToken(config);
      }

      this.logger.debug('Successfully obtained access token');
      return this.cachedToken.access_token;
    } catch (error) {
      this.logger.error('Failed to get access token', error as Error);
      throw new PasteImageError(
        `Failed to get WeChat access token: ${(error as Error).message}`,
        ERROR_CODES.WECHAT_AUTH_FAILED,
        error as Error
      );
    }
  }

  /**
   * Upload image to WeChat material library
   */
  public async uploadMaterial(
    config: WeChatConfig,
    imagePath: string,
    type: 'image' = 'image'
  ): Promise<WeChatUploadResult> {
    try {
      const accessToken = await this.getAccessToken(config);

      // Prepare form data
      const formData = new FormData();
      formData.append('media', fs.createReadStream(imagePath));
      formData.append('type', type);

      const url = `${config.baseUrl}/cgi-bin/material/add_material?access_token=${accessToken}&type=${type}`;

      this.logger.debug(`Uploading material to: ${url.replace(accessToken, '[TOKEN]')}`);

      const response = await this.makeHttpRequest<WeChatApiResponse>(url, {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData,
      });

      if (response.errcode && response.errcode !== 0) {
        throw new Error(`WeChat API error: ${response.errcode} - ${response.errmsg}`);
      }

      // Convert HTTP URL to HTTPS
      const httpsUrl = response['url'] ? response['url'].replace('http://', 'https://') : undefined;

      return {
        success: true,
        media_id: response['media_id'],
        url: httpsUrl,
      };
    } catch (error) {
      this.logger.error('Failed to upload material to WeChat', error as Error);
      return {
        success: false,
        error: (error as Error).message,
        errcode: (error as any).errcode,
        errmsg: (error as any).errmsg,
      };
    }
  }

  /**
   * Get regular access token
   */
  private async getRegularAccessToken(config: WeChatConfig): Promise<WeChatAccessToken> {
    const url = `${config.baseUrl}/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`;

    const response = await this.makeHttpRequest<WeChatApiResponse>(url);

    if (response.errcode) {
      throw new Error(`WeChat API error: ${response.errcode} - ${response.errmsg}`);
    }

    return {
      access_token: response['access_token'],
      expires_in: response['expires_in'] || 7200, // Default 2 hours
      timestamp: Date.now(),
    };
  }

  /**
   * Get stable access token (recommended)
   */
  private async getStableAccessToken(config: WeChatConfig): Promise<WeChatAccessToken> {
    const url = `${config.baseUrl}/cgi-bin/stable_token`;

    const body = JSON.stringify({
      grant_type: 'client_credential',
      appid: config.appId,
      secret: config.appSecret,
    });

    const response = await this.makeHttpRequest<WeChatApiResponse>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body,
    });

    if (response.errcode) {
      throw new Error(`WeChat API error: ${response.errcode} - ${response.errmsg}`);
    }

    return {
      access_token: response['access_token'],
      expires_in: response['expires_in'] || 7200, // Default 2 hours
      timestamp: Date.now(),
    };
  }

  /**
   * Check if cached token is still valid
   */
  private isTokenValid(token: WeChatAccessToken): boolean {
    const now = Date.now();
    const expiresAt = token.timestamp + (token.expires_in - 300) * 1000; // 5 min buffer
    return now < expiresAt;
  }

  /**
   * Validate WeChat configuration
   */
  private validateConfig(config: WeChatConfig): void {
    if (!config.enabled) {
      throw new PasteImageError(
        'WeChat integration is disabled',
        ERROR_CODES.WECHAT_CONFIG_INVALID
      );
    }

    if (!config.appId || !config.appSecret) {
      throw new PasteImageError(
        'WeChat AppID and AppSecret are required',
        ERROR_CODES.WECHAT_CONFIG_INVALID
      );
    }

    if (!config.baseUrl) {
      throw new PasteImageError('WeChat Base URL is required', ERROR_CODES.WECHAT_CONFIG_INVALID);
    }

    // Validate URL format
    try {
      new URL(config.baseUrl);
    } catch {
      throw new PasteImageError(
        'Invalid WeChat Base URL format',
        ERROR_CODES.WECHAT_CONFIG_INVALID
      );
    }
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async makeHttpRequest<T>(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      body?: string | FormData;
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const { method = 'GET', headers = {}, body } = options || {};

      const urlObj = new URL(url);
      const requestOptions: https.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
        timeout: 30000, // 30 seconds timeout
      };

      const req = https.request(requestOptions, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        if (typeof body === 'object' && 'pipe' in body && typeof body.pipe === 'function') {
          (body as any).pipe(req);
        } else {
          req.write(body);
          req.end();
        }
      } else {
        req.end();
      }
    });
  }

  /**
   * Clear cached token (useful for testing or manual refresh)
   */
  public clearTokenCache(): void {
    this.cachedToken = null;
    this.logger.debug('Access token cache cleared');
  }
}
