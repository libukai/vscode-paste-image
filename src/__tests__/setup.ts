/**
 * Jest setup file for Paste Image extension tests
 */

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  ensureDir: jest.fn(),
  stat: jest.fn(),
}));

// Mock clipboardy
jest.mock('clipboardy', () => ({
  read: jest.fn(),
  write: jest.fn(),
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
