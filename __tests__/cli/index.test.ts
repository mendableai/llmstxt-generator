import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as core from '../../lib/core';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('readline');
jest.mock('../../lib/core');

// Mock process.env and process.exit
const originalEnv = process.env;
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process.exit called with code ${code}`);
});

describe('CLI Interface', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockStdout: any;
  let mockStdin: any;
  let mockReadlineInterface: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock process.env
    process.env = { ...originalEnv };
    
    // Mock path.resolve to return the input unchanged
    (path.resolve as jest.Mock).mockImplementation((p) => p);
    
    // Mock readline
    mockStdout = { write: jest.fn() };
    mockStdin = { on: jest.fn() };
    mockReadlineInterface = {
      question: jest.fn((query, callback) => callback('mock-api-key')),
      close: jest.fn()
    };
    (readline.createInterface as jest.Mock).mockReturnValue(mockReadlineInterface);
    
    // Mock core functions
    (core.filterEnglishText as jest.Mock).mockImplementation((text) => `filtered:${text}`);
    (core.removeHeadersFooters as jest.Mock).mockImplementation((pages) => 
      pages.map((p: string) => `noheader:${p}`)
    );
    (core.exportCleanText as jest.Mock).mockImplementation((text) => `cleaned:${text}`);
  });
  
  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });
  
  afterAll(() => {
    mockExit.mockRestore();
  });

  describe('API Key Handling', () => {
    it('should use API key from command line option', async () => {
      // Mock fs functions for this test
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify API key was used (not prompted)
      expect(readline.createInterface).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should use API key from environment variable', async () => {
      // Set environment variable
      process.env.LLMSTXT_API_KEY = 'env-api-key-12345678901234567890123456789012';
      
      // Mock fs functions for this test
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = ['node', 'cli/index.js', '-i', 'input.txt', '-o', 'output.txt'];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify API key was used from env (not prompted)
      expect(readline.createInterface).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should prompt for API key if not provided', async () => {
      // Mock fs functions for this test
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = ['node', 'cli/index.js', '-i', 'input.txt', '-o', 'output.txt'];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify API key was prompted
      expect(readline.createInterface).toHaveBeenCalled();
      expect(mockReadlineInterface.question).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should throw error for invalid API key format', async () => {
      // Mock fs functions for this test
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--api-key', 'invalid-key'  // Too short
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI and expect error
      expect(runCLI).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:', 'Invalid API key format.'
      );
    });
  });

  describe('Input Validation', () => {
    it('should throw error if input file does not exist', () => {
      // Mock fs.existsSync to return false (file doesn't exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'nonexistent.txt', 
            '-o', 'output.txt',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI and expect error
      expect(runCLI).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:', 'Input file does not exist.'
      );
    });
    
    it('should throw error if input file is empty', () => {
      // Mock fs functions
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'empty.txt', 
            '-o', 'output.txt',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI and expect error
      expect(runCLI).toThrow();
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error:', 'Input file is empty.'
      );
    });
  });

  describe('Processing Options', () => {
    beforeEach(() => {
      // Mock fs functions for all tests in this describe block
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
    });
    
    it('should apply all processing steps by default', () => {
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify all processing steps were applied
      expect(core.filterEnglishText).toHaveBeenCalled();
      expect(core.removeHeadersFooters).toHaveBeenCalled();
      expect(core.exportCleanText).toHaveBeenCalled();
    });
    
    it('should skip filtering when --no-filter is specified', () => {
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--no-filter',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify filtering was skipped
      expect(core.filterEnglishText).not.toHaveBeenCalled();
      expect(core.removeHeadersFooters).toHaveBeenCalled();
      expect(core.exportCleanText).toHaveBeenCalled();
    });
    
    it('should skip header/footer removal when --no-header-footer is specified', () => {
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--no-header-footer',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify header/footer removal was skipped
      expect(core.filterEnglishText).toHaveBeenCalled();
      expect(core.removeHeadersFooters).not.toHaveBeenCalled();
      expect(core.exportCleanText).toHaveBeenCalled();
    });
  });

  describe('File I/O', () => {
    it('should write processed output to the specified file', () => {
      // Mock fs functions
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('test content');
      
      // Import the CLI module (this will execute the script)
      const runCLI = () => {
        jest.isolateModules(() => {
          process.argv = [
            'node', 'cli/index.js', 
            '-i', 'input.txt', 
            '-o', 'output.txt',
            '--api-key', 'valid-api-key-12345678901234567890123456789012'
          ];
          require('../../cli/index');
        });
      };
      
      // Run the CLI
      runCLI();
      
      // Verify output was written to the correct file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'output.txt',
        expect.any(String),
        'utf8'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Processing complete. Output written to',
        'output.txt'
      );
    });
  });
});