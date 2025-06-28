/**
 * Mock implementation of VS Code API for testing
 */

export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showInputBox: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    show: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn(),
  })),
  activeTextEditor: undefined,
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
  })),
  onDidChangeConfiguration: jest.fn(),
  getWorkspaceFolder: jest.fn(),
  workspaceFolders: [],
};

export const commands = {
  registerCommand: jest.fn(),
};

export const Uri = {
  file: jest.fn(),
  parse: jest.fn(),
};

export const Range = jest.fn();
export const Position = jest.fn();
export const Selection = jest.fn();

// Mock VS Code constants and enums that might be used
export const ViewColumn = {
  One: 1,
  Two: 2,
  Three: 3,
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2,
};

// Export everything as a module
export default {
  window,
  workspace,
  commands,
  Uri,
  Range,
  Position,
  Selection,
  ViewColumn,
  StatusBarAlignment,
};
