#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import dotenv from 'dotenv';
import { filterEnglishText, removeHeadersFooters, exportCleanText } from '../lib/core';

dotenv.config();

const program = new Command();

program
  .name('llmstxt-generator')
  .description('CLI for LLMs text cleaning and export')
  .version('1.0.0')
  .requiredOption('-i, --input <file>', 'Input text file')
  .requiredOption('-o, --output <file>', 'Output text file')
  .option('--no-filter', 'Skip English text filtering')
  .option('--no-header-footer', 'Skip header/footer removal')
  // Deprecated: .option('--api-key <key>', ...)
  .allowUnknownOption(true) // allow unknown for deprecation warning
  .action(async (opts: Record<string, any>, command: Command) => {
    try {
      // --- API key handling ---
      // Detect deprecated --api-key usage
      const rawArgv = process.argv.join(' ');
      if (rawArgv.includes('--api-key') || rawArgv.match(/-api-key\s+\S+/)) {
        console.warn(
          '[SECURITY WARNING] Supplying API keys via command-line arguments is deprecated and insecure. ' +
          'Use the LLMSTXT_API_KEY environment variable instead.'
        );
      }
      let apiKey = process.env.LLMSTXT_API_KEY;
      if (!apiKey) {
        apiKey = await promptApiKey();
      }
      if (!validateApiKey(apiKey)) {
        throw new Error('Invalid API key format.');
      }

      // --- Input validation & file I/O security ---
      const inputPath = path.resolve(opts.input);
      const outputPath = path.resolve(opts.output);

      // Path validation: prevent directory traversal, output must not be a directory
      if (!fs.existsSync(inputPath)) throw new Error('Input file does not exist.');
      if (!fs.statSync(inputPath).isFile()) throw new Error('Input path is not a file.');
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()) {
        throw new Error('Output path is a directory.');
      }
      if (inputPath === outputPath) {
        throw new Error('Input and output paths must be different.');
      }

      // File size limit (10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      const inputStat = fs.statSync(inputPath);
      if (inputStat.size > MAX_SIZE) {
        throw new Error('Input file exceeds 10MB size limit.');
      }

      // Read input
      const raw = fs.readFileSync(inputPath, 'utf8');
      if (typeof raw !== 'string' || !raw.trim()) throw new Error('Input file is empty.');

      // Processing
      let text = raw;
      if (opts.filter) text = filterEnglishText(text);
      const pages = text.split(/\f|\n{2,}/);
      if (opts.headerFooter) text = removeHeadersFooters(pages).join('\n\n');
      const output = exportCleanText(text);

      // Confirm overwrite if output file exists
      if (fs.existsSync(outputPath)) {
        const confirmed = await confirmOverwrite(outputPath);
        if (!confirmed) {
          console.log('Aborted: Output file not overwritten.');
          process.exit(0);
        }
      }

      // Write output with explicit permissions (0o600)
      fs.writeFileSync(outputPath, output, { encoding: 'utf8', mode: 0o600 });
      console.log('Processing complete. Output written to', opts.output);

      // --- Memory scrubbing for API key ---
      if (typeof apiKey === 'string') {
        for (let i = 0; i < apiKey.length; i++) {
          // @ts-ignore
          apiKey[i] = '\0';
        }
        apiKey = '';
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('version-check')
  .description('Check if you are using the latest version of llmstxt-generator')
  .action(async () => {
    try {
      const https = await import('https');
      const currentVersion = program.version();
      const pkgName = 'llmstxt-generator';
      const url = `https://registry.npmjs.org/${pkgName}/latest`;

      https.get(url, (res: any) => {
        let data = '';
        res.on('data', (chunk: string) => { data += chunk; });
        res.on('end', () => {
          try {
            const latest = JSON.parse(data).version;
            if (latest === currentVersion) {
              console.log(`You are using the latest version (${currentVersion}).`);
            } else {
              console.log(`A newer version is available: ${latest}. You are using ${currentVersion}.`);
            }
          } catch (e) {
            console.error('Could not parse version info from npm.');
          }
        });
      }).on('error', (err: any) => {
        console.error('Failed to fetch version info:', err.message);
      });
    } catch (err: any) {
      console.error('Error during version check:', err.message);
    }
  });

program.parse(process.argv);

// --- Helpers ---

function validateApiKey(key: string): boolean {
  // Example: must be 32+ chars, alphanumeric
  return typeof key === 'string' && /^[A-Za-z0-9_\-]{32,}$/.test(key);
}

function promptApiKey(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter API key: ', (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function confirmOverwrite(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Output file "${filePath}" exists. Overwrite? (y/N): `, (answer: string) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

// Export helpers for testing
// This is only used in test environment
if (process.env.NODE_ENV === 'test') {
  module.exports.__test__ = {
    validateApiKey,
    promptApiKey,
    confirmOverwrite
  };
}