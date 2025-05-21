import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// We need to access the helper functions directly, so we'll need to import them
// Since they're not exported, we'll need to mock the CLI module and extract them
let validateApiKey: (key: string) => boolean;
let promptApiKey: () => Promise<string>;

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('readline');
jest.mock('../../lib/core');

describe('CLI Helper Functions', () => {
  let mockReadlineInterface: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock readline
    mockReadlineInterface = {
      question: jest.fn((query, callback) => callback('mock-api-key')),
      close: jest.fn()
    };
    (readline.createInterface as jest.Mock).mockReturnValue(mockReadlineInterface);
    
    // Extract helper functions from CLI module
    jest.isolateModules(() => {
      // We need to get the non-exported functions from the module
      // This is a bit hacky, but it's the only way to test these functions directly
      const cliModule = require('../../cli/index');
      
      // Extract the functions we want to test
      // These are defined in the module but not exported
      validateApiKey = (cliModule as any).__test__.validateApiKey;
      promptApiKey = (cliModule as any).__test__.promptApiKey;
    });
  });

  describe('validateApiKey', () => {
    it('should return false for empty keys', () => {
      expect(validateApiKey('')).toBe(false);
      expect(validateApiKey(null as any)).toBe(false);
      expect(validateApiKey(undefined as any)).toBe(false);
    });
    
    it('should return false for keys shorter than 32 characters', () => {
      expect(validateApiKey('short-key')).toBe(false);
      expect(validateApiKey('A'.repeat(31))).toBe(false);
    });
    
    it('should return false for keys with invalid characters', () => {
      expect(validateApiKey('invalid!key@12345678901234567890123456')).toBe(false);
      expect(validateApiKey('invalid key 12345678901234567890123456')).toBe(false);
    });
    
    it('should return true for valid API keys', () => {
      expect(validateApiKey('valid-api-key-12345678901234567890123456789012')).toBe(true);
      expect(validateApiKey('A'.repeat(32))).toBe(true);
      expect(validateApiKey('a_valid-API-key_1234567890123456789012')).toBe(true);
    });
  });

  describe('promptApiKey', () => {
    it('should prompt the user for an API key', async () => {
      const apiKey = await promptApiKey();
      
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout
      });
      expect(mockReadlineInterface.question).toHaveBeenCalledWith(
        'Enter API key: ',
        expect.any(Function)
      );
      expect(mockReadlineInterface.close).toHaveBeenCalled();
      expect(apiKey).toBe('mock-api-key');
    });
    
    it('should trim whitespace from the entered API key', async () => {
      // Override the mock implementation for this test
      mockReadlineInterface.question.mockImplementationOnce((query, callback) => 
        callback('  mock-api-key-with-spaces  ')
      );
      
      const apiKey = await promptApiKey();
      
      expect(apiKey).toBe('mock-api-key-with-spaces');
    });
  });
});