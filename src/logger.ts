import * as vscode from 'vscode';
import { format } from 'date-fns';

/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Modern logger implementation with proper error handling and formatting
 */
export class Logger {
  private static instance: Logger | undefined;
  private readonly outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  /**
   * Get the singleton logger instance
   */
  public static getInstance(channelName = 'Paste Image'): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(channelName);
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message
   */
  public debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log an info message
   */
  public info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error, ...args: unknown[]): void {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    this.log(LogLevel.ERROR, errorMessage, ...args);

    if (error?.stack) {
      this.log(LogLevel.ERROR, error.stack);
    }
  }

  /**
   * Show an information message to the user
   */
  public async showInformationMessage(
    message: string,
    ...items: string[]
  ): Promise<string | undefined> {
    this.info(message);
    return vscode.window.showInformationMessage(message, ...items);
  }

  /**
   * Show a warning message to the user
   */
  public async showWarningMessage(
    message: string,
    ...items: string[]
  ): Promise<string | undefined> {
    this.warn(message);
    return vscode.window.showWarningMessage(message, ...items);
  }

  /**
   * Show an error message to the user
   */
  public async showErrorMessage(
    message: string,
    error?: Error,
    ...items: string[]
  ): Promise<string | undefined> {
    this.error(message, error);
    return vscode.window.showErrorMessage(message, ...items);
  }

  /**
   * Show the output channel
   */
  public show(preserveFocus?: boolean): void {
    this.outputChannel.show(preserveFocus);
  }

  /**
   * Clear the output channel
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Dispose of the logger resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
    Logger.instance = undefined;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = format(new Date(), 'MM-dd HH:mm:ss.SSS');
    const levelName = LogLevel[level];
    const formattedArgs = args.length > 0 ? ` ${this.formatArgs(args)}` : '';
    const logMessage = `[${timestamp}] [${levelName}] ${message}${formattedArgs}`;

    this.outputChannel.appendLine(logMessage);
  }

  /**
   * Format additional arguments for logging
   */
  private formatArgs(args: unknown[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'string') {
          return arg;
        }
        if (arg instanceof Error) {
          return `Error: ${arg.message}`;
        }
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
  }
}
