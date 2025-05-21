# Tests for llmstxt-generator

This directory contains tests for the llmstxt-generator web app, focusing on the newly enhanced features:

1. **Language Filter Module** (`lib/languageFilter.ts`)
2. **Header/Footer Remover Module** (`lib/headerFooterRemover.ts`)
3. **Clean Text Exporter Module** (`lib/cleanTextExporter.ts`)
4. **API Route Modifications** (`app/api/service/route.ts`)
5. **UI Updates** (`app/(home)/page.tsx`)

## Test Structure

- `__tests__/lib/`: Unit tests for library modules
- `__tests__/app/api/`: Tests for API routes
- `__tests__/app/(home)/`: Tests for UI components

## Running Tests

To run the tests, first install the dependencies:

```bash
npm install
```

Then run the tests:

```bash
npm test
```

To run tests with watch mode (for development):

```bash
npm run test:watch
```

## Test Coverage

The tests cover:

- Unit tests for each module to verify they work correctly in isolation
- Integration tests to ensure the modules work together properly
- API endpoint tests to verify the route handles requests and responses correctly
- UI component tests to verify the toggles and display of enhanced output

## Edge Cases Tested

- Empty content
- Mixed language content
- Content with headers and footers
- Content with various whitespace formatting issues
- Error handling in the processing pipeline

## Test Approach

These tests follow the Test-Driven Development (TDD) approach:

1. Write failing tests first
2. Implement minimal code to make tests pass
3. Refactor while keeping tests green

The tests are designed to be independent and focused on specific functionality, making it easier to identify issues when they arise.