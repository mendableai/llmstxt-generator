// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.FIRECRAWL_API_KEY = 'test-firecrawl-api-key';
process.env.SUPABASE_URL = 'https://test-supabase-url.supabase.co';
process.env.SUPABASE_KEY = 'test-supabase-key';

// Mock the FirecrawlApp class
jest.mock('@mendable/firecrawl-js', () => {
  return {
    __esModule: true,
    default: class FirecrawlApp {
      constructor() {
        this.generateLLMsText = jest.fn().mockResolvedValue({
          success: true,
          data: {
            llmstxt: 'Mocked llmstxt content',
            llmsfulltxt: 'Mocked llmsfulltxt content'
          }
        });
      }
    }
  };
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null })
    })
  };
});

// Global fetch mock for API tests
global.fetch = jest.fn();