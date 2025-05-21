import { POST } from '../../../../app/api/service/route';
import { filterEnglishText } from '../../../../lib/languageFilter';
import { removeHeadersFooters } from '../../../../lib/headerFooterRemover';
import { exportCleanText } from '../../../../lib/cleanTextExporter';

// Mock the modules
jest.mock('../../../../lib/languageFilter', () => ({
  filterEnglishText: jest.fn((text) => `ENGLISH_FILTERED: ${text}`)
}));

jest.mock('../../../../lib/headerFooterRemover', () => ({
  removeHeadersFooters: jest.fn((pages) => pages.map(page => `HEADERS_FOOTERS_REMOVED: ${page}`))
}));

jest.mock('../../../../lib/cleanTextExporter', () => ({
  exportCleanText: jest.fn((text) => `CLEAN_EXPORTED: ${text}`)
}));

// Mock NextResponse
const mockJson = jest.fn();
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any) => {
      mockJson(data);
      return { data };
    }
  }
}));

describe('API Route: /api/service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ mapUrls: ['url1', 'url2'] })
    });
  });

  it('should process request with default options (no enhancements)', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key'
      })
    };

    await POST(mockRequest as any);

    // Verify that none of the enhancement modules were called
    expect(filterEnglishText).not.toHaveBeenCalled();
    expect(removeHeadersFooters).not.toHaveBeenCalled();
    expect(exportCleanText).not.toHaveBeenCalled();

    // Verify that the response includes the expected fields
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        llmstxt: expect.any(String),
        llmsFulltxt: expect.any(String),
        enhancedOutput: expect.any(String)
      })
    );
  });

  it('should apply language filtering when filterEnglish is true', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key',
        filterEnglish: true
      })
    };

    await POST(mockRequest as any);

    // Verify that filterEnglishText was called
    expect(filterEnglishText).toHaveBeenCalled();
    
    // Verify that the response includes the enhanced output
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancedOutput: expect.stringContaining('ENGLISH_FILTERED')
      })
    );
  });

  it('should apply header/footer removal when removeHeadersFooters is true', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key',
        removeHeadersFooters: true
      })
    };

    await POST(mockRequest as any);

    // Verify that removeHeadersFooters was called
    expect(removeHeadersFooters).toHaveBeenCalled();
    
    // Verify that the response includes the enhanced output
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancedOutput: expect.stringContaining('HEADERS_FOOTERS_REMOVED')
      })
    );
  });

  it('should apply clean export when cleanExport is true', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key',
        cleanExport: true
      })
    };

    await POST(mockRequest as any);

    // Verify that exportCleanText was called
    expect(exportCleanText).toHaveBeenCalled();
    
    // Verify that the response includes the enhanced output
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancedOutput: expect.stringContaining('CLEAN_EXPORTED')
      })
    );
  });

  it('should apply all enhancements when all options are true', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key',
        filterEnglish: true,
        removeHeadersFooters: true,
        cleanExport: true
      })
    };

    await POST(mockRequest as any);

    // Verify that all enhancement modules were called
    expect(removeHeadersFooters).toHaveBeenCalled();
    expect(filterEnglishText).toHaveBeenCalled();
    expect(exportCleanText).toHaveBeenCalled();
    
    // Verify that the response includes the enhanced output
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        enhancedOutput: expect.stringContaining('CLEAN_EXPORTED')
      })
    );
  });

  it('should handle errors in the enhancement pipeline gracefully', async () => {
    // Mock filterEnglishText to throw an error
    (filterEnglishText as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        url: 'https://example.com',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        bringYourOwnFirecrawlApiKey: 'test-key',
        filterEnglish: true
      })
    };

    // Mock console.error to prevent test output pollution
    const originalConsoleError = console.error;
    console.error = jest.fn();

    await POST(mockRequest as any);

    // Restore console.error
    console.error = originalConsoleError;

    // Verify that the response still includes the original outputs
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        llmstxt: expect.any(String),
        llmsFulltxt: expect.any(String)
      })
    );
  });
});