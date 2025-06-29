import * as https from 'https';
import { WeChatApiService } from '../wechat-api';
import { Logger } from '../logger';
import { WeChatConfig, ERROR_CODES, PasteImageError } from '../types';

// Mock dependencies
jest.mock('https');
jest.mock('../logger');

const mockHttps = https as jest.Mocked<typeof https>;

describe('WeChatApiService', () => {
  let wechatApiService: WeChatApiService;
  let mockLogger: jest.Mocked<Logger>;

  const mockConfig: WeChatConfig = {
    enabled: true,
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    baseUrl: 'https://api.weixin.qq.com',
    useStableToken: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    wechatApiService = new WeChatApiService(mockLogger);
  });

  describe('validateConfig', () => {
    it('should throw error when WeChat is disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };

      await expect(wechatApiService.getAccessToken(disabledConfig)).rejects.toThrow(
        new PasteImageError('WeChat integration is disabled', ERROR_CODES.WECHAT_CONFIG_INVALID)
      );
    });

    it('should throw error when AppID is missing', async () => {
      const invalidConfig = { ...mockConfig, appId: '' };

      await expect(wechatApiService.getAccessToken(invalidConfig)).rejects.toThrow(
        new PasteImageError(
          'WeChat AppID and AppSecret are required',
          ERROR_CODES.WECHAT_CONFIG_INVALID
        )
      );
    });

    it('should throw error when AppSecret is missing', async () => {
      const invalidConfig = { ...mockConfig, appSecret: '' };

      await expect(wechatApiService.getAccessToken(invalidConfig)).rejects.toThrow(
        new PasteImageError(
          'WeChat AppID and AppSecret are required',
          ERROR_CODES.WECHAT_CONFIG_INVALID
        )
      );
    });

    it('should throw error when BaseURL is missing', async () => {
      const invalidConfig = { ...mockConfig, baseUrl: '' };

      await expect(wechatApiService.getAccessToken(invalidConfig)).rejects.toThrow(
        new PasteImageError('WeChat Base URL is required', ERROR_CODES.WECHAT_CONFIG_INVALID)
      );
    });

    it('should throw error when BaseURL is invalid', async () => {
      const invalidConfig = { ...mockConfig, baseUrl: 'invalid-url' };

      await expect(wechatApiService.getAccessToken(invalidConfig)).rejects.toThrow(
        new PasteImageError('Invalid WeChat Base URL format', ERROR_CODES.WECHAT_CONFIG_INVALID)
      );
    });
  });

  describe('getAccessToken', () => {
    it('should get stable access token successfully', async () => {
      // Mock successful HTTPS request
      const mockResponse = {
        access_token: 'test_access_token',
        expires_in: 7200,
      };

      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        // Simulate successful response
        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      const accessToken = await wechatApiService.getAccessToken(mockConfig);

      expect(accessToken).toBe('test_access_token');
      expect(mockLogger.debug).toHaveBeenCalledWith('Fetching new access token');
      expect(mockLogger.debug).toHaveBeenCalledWith('Successfully obtained access token');
    });

    it('should handle WeChat API error response', async () => {
      // Mock error response
      const mockErrorResponse = {
        errcode: 40013,
        errmsg: 'invalid appid',
      };

      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        // Simulate error response
        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockErrorResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      await expect(wechatApiService.getAccessToken(mockConfig)).rejects.toThrow(
        new PasteImageError(
          expect.stringContaining('WeChat API error: 40013 - invalid appid'),
          ERROR_CODES.WECHAT_AUTH_FAILED
        )
      );
    });

    it('should use cached token when still valid', async () => {
      // First call to get token
      const mockResponse = {
        access_token: 'test_access_token',
        expires_in: 7200,
      };

      let callCount = 0;
      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        callCount++;
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      // First call
      const firstToken = await wechatApiService.getAccessToken(mockConfig);
      expect(firstToken).toBe('test_access_token');

      // Second call should use cached token
      const secondToken = await wechatApiService.getAccessToken(mockConfig);
      expect(secondToken).toBe('test_access_token');

      // Should only make one HTTP request
      expect(callCount).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Using cached access token');
    });
  });

  describe('uploadMaterial', () => {
    beforeEach(() => {
      // Mock getAccessToken to return a valid token
      jest.spyOn(wechatApiService, 'getAccessToken').mockResolvedValue('test_access_token');
    });

    it('should upload material successfully', async () => {
      const mockUploadResponse = {
        media_id: 'test_media_id',
        url: 'http://mmbiz.qpic.cn/test.jpg',
      };

      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockUploadResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      const result = await wechatApiService.uploadMaterial(mockConfig, '/test/image.png');

      expect(result.success).toBe(true);
      expect(result.media_id).toBe('test_media_id');
      expect(result.url).toBe('https://mmbiz.qpic.cn/test.jpg'); // Should convert to HTTPS
    });

    it('should handle upload error response', async () => {
      const mockErrorResponse = {
        errcode: 40004,
        errmsg: 'invalid media type',
      };

      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockErrorResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      const result = await wechatApiService.uploadMaterial(mockConfig, '/test/image.png');

      expect(result.success).toBe(false);
      expect(result.error).toContain('WeChat API error: 40004 - invalid media type');
    });
  });

  describe('clearTokenCache', () => {
    it('should clear cached token', async () => {
      // Set up initial token
      const mockResponse = {
        access_token: 'test_access_token',
        expires_in: 7200,
      };

      mockHttps.request = jest.fn().mockImplementation((options, callback) => {
        const mockReq = {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };

        setTimeout(() => {
          const mockRes = {
            on: jest.fn((event, handler) => {
              if (event === 'data') {
                handler(JSON.stringify(mockResponse));
              } else if (event === 'end') {
                handler();
              }
            }),
          };
          if (typeof callback === 'function') {
            callback(mockRes);
          }
        }, 0);

        return mockReq;
      }) as any;

      // Get initial token
      await wechatApiService.getAccessToken(mockConfig);

      // Clear cache
      wechatApiService.clearTokenCache();

      // Next call should fetch new token
      await wechatApiService.getAccessToken(mockConfig);

      expect(mockLogger.debug).toHaveBeenCalledWith('Access token cache cleared');
      expect(mockLogger.debug).toHaveBeenCalledWith('Fetching new access token');
    });
  });
});
