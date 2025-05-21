# llmstxt-generator CLI

Generate consolidated text files from websites for LLM training and inference, via a powerful CLI and web interface. Powered by [@firecrawl_dev](https://twitter.com/firecrawl_dev) for web crawling and GPT-4-mini for text processing.

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Using npm (Node.js)](#using-npm-nodejs)
  - [Using Prebuilt Binaries](#using-prebuilt-binaries)
- [Usage](#usage)
  - [Basic Command](#basic-command)
  - [Options](#options)
  - [Examples](#examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Web vs CLI Comparison](#web-vs-cli-comparison)
- [Development Guide](#development-guide)
- [License](#license)

---

## Features

- Crawl websites and combine content into a single text file for LLM training or inference.
- Generates both standard (`llms.txt`) and full (`llms-full.txt`) versions.
- Supports web interface, REST API, and CLI usage.
- Flexible output options and filtering.
- No API key required for basic usage (web).
- Advanced features available with API keys.

---

## Installation

### Using npm (Node.js)

> Requires [Node.js](https://nodejs.org/) v18+ and npm.

```bash
npm install -g llmstxt-generator
```

### Using Prebuilt Binaries

Prebuilt binaries are available for Linux, macOS, and Windows.

1. Download the latest release from [Releases](https://github.com/firecrawl/llmstxt-generator/releases).
2. Extract the archive and move the binary to a directory in your `PATH` (e.g., `/usr/local/bin`).

```bash
# Example for Linux/macOS
chmod +x llmstxt-generator
sudo mv llmstxt-generator /usr/local/bin/
```

---

## Usage

### Basic Command

```bash
llmstxt-generator <url> [options]
```

- `<url>`: The website URL to crawl and process.

### Options

| Option                | Description                                                      |
|-----------------------|------------------------------------------------------------------|
| `-o, --output <file>` | Output file path (default: `llms.txt` in current directory)      |
| `--full`              | Generate a full version (`llms-full.txt`) with all extracted text|
| `--filter <lang>`     | Filter output by language (e.g., `en`, `es`)                    |
| `--api-key <key>`     | Provide Firecrawl API key for higher rate limits                |
| `--openai-key <key>`  | Provide OpenAI API key for advanced text processing             |
| `--max-pages <n>`     | Limit the number of pages to crawl                              |
| `--timeout <ms>`      | Set crawling timeout in milliseconds                            |
| `-v, --verbose`       | Enable verbose logging                                          |
| `-h, --help`          | Show help message                                               |
| `--version`           | Show CLI version                                                |

### Examples

#### Generate a standard llms.txt from a website

```bash
llmstxt-generator https://example.com
```

#### Generate a full version and specify output file

```bash
llmstxt-generator https://example.com --full -o mysite.txt
```

#### Filter output to English only

```bash
llmstxt-generator https://example.com --filter en
```

#### Use API keys for advanced features

```bash
llmstxt-generator https://example.com --api-key YOUR_FIRECRAWL_KEY --openai-key YOUR_OPENAI_KEY
```

#### Limit crawl to 10 pages and set a timeout

```bash
llmstxt-generator https://example.com --max-pages 10 --timeout 60000
```

---

## Security Best Practices

- **API Keys:**  
  - Never commit your API keys to version control or share them publicly.
  - Store keys in environment variables or use a `.env` file (not tracked by git).
  - Use separate keys for development and production.
  - Rotate keys regularly and revoke unused ones.

- **.env File Example:**

  ```
  FIRECRAWL_API_KEY=your_firecrawl_key
  OPENAI_API_KEY=your_openai_key
  ```

- **Permissions:**  
  - Restrict file permissions on `.env` and configuration files (`chmod 600 .env`).
  - Avoid running the CLI as root unless necessary.

- **Network:**  
  - Only use API keys with trusted endpoints.
  - Monitor usage for suspicious activity.

---

## Troubleshooting

| Issue                                   | Solution                                                                 |
|------------------------------------------|--------------------------------------------------------------------------|
| `command not found: llmstxt-generator`   | Ensure npm global bin is in your `PATH` or binary is installed correctly.|
| "API key required" error                 | Provide a valid API key with `--api-key` or in your `.env` file.         |
| "Timeout" or incomplete output           | Increase `--timeout` or check network connectivity.                      |
| "Too many requests" or rate limiting     | Use your own API key for higher limits.                                  |
| Output file not created                  | Check write permissions in the target directory.                         |
| Unexpected errors                        | Run with `-v` for verbose logs and check for updates.                    |

---

## Web vs CLI Comparison

| Feature                | Web App                        | CLI Tool                        |
|------------------------|--------------------------------|---------------------------------|
| Platform               | Browser                        | Node.js / Binary                |
| Installation           | None (web)                     | npm or binary                   |
| API Key Required       | No (basic), Yes (advanced)     | No (basic), Yes (advanced)      |
| Output Format          | Download via browser           | File in local directory         |
| Automation             | Manual                         | Scriptable, automatable         |
| Advanced Options       | Limited                        | Full CLI flexibility            |
| Best For               | Quick use, non-technical users | Power users, batch processing   |

---

## Development Guide

### Prerequisites

- Node.js v18+ and npm
- (Optional) Firecrawl and OpenAI API keys for full functionality

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/firecrawl/llmstxt-generator.git
   cd llmstxt-generator
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:

   ```
   FIRECRAWL_API_KEY=
   OPENAI_API_KEY=
   ```

4. Run the CLI locally:

   ```bash
   npm run build
   node cli/index.js <url> [options]
   ```

### Running Tests

```bash
npm test
```

### Contributing

- Fork the repository and create a feature branch.
- Follow the existing code style and add tests for new features.
- Open a pull request with a clear description of your changes.

### Project Structure

- `cli/` – CLI entry point and helpers
- `lib/` – Core logic and utilities
- `app/` – Web interface (Next.js)
- `__tests__/` – Unit and integration tests

---

## License

[MIT](LICENSE)
