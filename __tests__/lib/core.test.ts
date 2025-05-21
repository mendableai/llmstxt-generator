import { exportCleanText, removeHeadersFooters, filterEnglishText, filterEnglishLines } from '../../lib/core';
import * as cleanTextExporter from '../../lib/cleanTextExporter';
import * as headerFooterRemover from '../../lib/headerFooterRemover';
import * as languageFilter from '../../lib/languageFilter';

// Mock the imported modules
jest.mock('../../lib/cleanTextExporter');
jest.mock('../../lib/headerFooterRemover');
jest.mock('../../lib/languageFilter');

describe('Core Library Module', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (cleanTextExporter.exportCleanText as jest.Mock).mockImplementation(text => `cleaned:${text}`);
    (headerFooterRemover.removeHeadersFooters as jest.Mock).mockImplementation(pages => 
      pages.map(p => `noheader:${p}`)
    );
    (languageFilter.filterEnglishText as jest.Mock).mockImplementation(text => `english:${text}`);
    (languageFilter.filterEnglishLines as jest.Mock).mockImplementation(lines => 
      lines.map(l => `english:${l}`)
    );
  });

  describe('exportCleanText', () => {
    it('should correctly forward calls to the cleanTextExporter module', () => {
      const input = 'test text';
      const result = exportCleanText(input);
      
      expect(cleanTextExporter.exportCleanText).toHaveBeenCalledWith(input);
      expect(result).toBe('cleaned:test text');
    });
  });

  describe('removeHeadersFooters', () => {
    it('should correctly forward calls to the headerFooterRemover module', () => {
      const input = ['page1', 'page2'];
      const result = removeHeadersFooters(input);
      
      expect(headerFooterRemover.removeHeadersFooters).toHaveBeenCalledWith(input);
      expect(result).toEqual(['noheader:page1', 'noheader:page2']);
    });

    it('should pass the threshold parameter correctly', () => {
      const input = ['page1', 'page2'];
      const threshold = 0.8;
      removeHeadersFooters(input, threshold);
      
      expect(headerFooterRemover.removeHeadersFooters).toHaveBeenCalledWith(input, threshold);
    });
  });

  describe('filterEnglishText', () => {
    it('should correctly forward calls to the languageFilter module', () => {
      const input = 'mixed language text';
      const result = filterEnglishText(input);
      
      expect(languageFilter.filterEnglishText).toHaveBeenCalledWith(input);
      expect(result).toBe('english:mixed language text');
    });
  });

  describe('filterEnglishLines', () => {
    it('should correctly forward calls to the languageFilter module', () => {
      const input = ['line1', 'line2'];
      const result = filterEnglishLines(input);
      
      expect(languageFilter.filterEnglishLines).toHaveBeenCalledWith(input);
      expect(result).toEqual(['english:line1', 'english:line2']);
    });
  });
});