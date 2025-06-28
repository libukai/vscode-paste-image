import * as vscode from 'vscode';
import { Logger, LogLevel } from './logger';
import { ConfigManager } from './config';
import { ImageProcessor } from './image-processor';
import { PasteImageError } from './types';
import { ClipboardManager } from './clipboard';

/**
 * Extension activation function
 */
export function activate(context: vscode.ExtensionContext): void {
  const logger = Logger.getInstance('Paste Image');
  logger.info('Paste Image extension is activating...');

  try {
    // Set log level based on development environment
    if (process.env['NODE_ENV'] === 'development') {
      logger.setLogLevel(LogLevel.DEBUG);
    }

    // Create dependencies
    const clipboardManager = new ClipboardManager(logger);
    const imageProcessor = new ImageProcessor(logger, clipboardManager);

    // Register the paste command
    const pasteCommand = vscode.commands.registerCommand('extension.pasteImage', async () => {
      try {
        logger.debug('Paste image command triggered');

        // Get current configuration
        const config = ConfigManager.getConfig();
        logger.debug('Configuration loaded', config);

        // Execute paste operation
        await imageProcessor.pasteImage(config);
      } catch (error) {
        if (error instanceof PasteImageError) {
          logger.error(`Paste operation failed: ${error.message}`, error);
        } else {
          logger.error('Unexpected error during paste operation', error as Error);
        }
      }
    });

    // Watch for configuration changes
    const configWatcher = ConfigManager.onConfigurationChanged(newConfig => {
      logger.info('Configuration updated');
      logger.debug('New configuration', newConfig);
    }, logger);

    // Register disposables
    context.subscriptions.push(pasteCommand, configWatcher, logger);

    logger.info('Paste Image extension activated successfully');
  } catch (error) {
    logger.error('Failed to activate Paste Image extension', error as Error);
    throw error;
  }
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  const logger = Logger.getInstance();
  logger.info('Paste Image extension is deactivating...');

  // Logger disposal is handled by the disposables system
  logger.info('Paste Image extension deactivated');
}
