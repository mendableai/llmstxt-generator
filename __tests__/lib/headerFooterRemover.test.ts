import { removeHeadersFooters } from '../../lib/headerFooterRemover';

describe('Header/Footer Remover Module', () => {
  describe('removeHeadersFooters', () => {
    it('should return an empty array when input is empty', () => {
      expect(removeHeadersFooters([])).toEqual([]);
      expect(removeHeadersFooters(null as any)).toEqual([]);
      expect(removeHeadersFooters(undefined as any)).toEqual([]);
    });

    it('should identify and remove headers that appear in most pages', () => {
      const pages = [
        'WEBSITE HEADER\nContent for page 1\nMore content for page 1\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 2\nMore content for page 2\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 3\nMore content for page 3\nWEBSITE FOOTER'
      ];

      const expected = [
        'Content for page 1\nMore content for page 1',
        'Content for page 2\nMore content for page 2',
        'Content for page 3\nMore content for page 3'
      ];

      expect(removeHeadersFooters(pages)).toEqual(expected);
    });

    it('should respect the threshold parameter', () => {
      const pages = [
        'WEBSITE HEADER\nContent for page 1\nMore content for page 1\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 2\nMore content for page 2\nWEBSITE FOOTER',
        'DIFFERENT HEADER\nContent for page 3\nMore content for page 3\nDIFFERENT FOOTER'
      ];

      // With default threshold (0.6), both headers/footers should be removed
      // since they appear in 2/3 pages (66.7%)
      const expectedDefault = [
        'Content for page 1\nMore content for page 1',
        'Content for page 2\nMore content for page 2',
        'Content for page 3\nMore content for page 3'
      ];
      expect(removeHeadersFooters(pages)).toEqual(expectedDefault);

      // With higher threshold (0.8), headers/footers should be kept
      // since they appear in only 2/3 pages (66.7%)
      const expectedHighThreshold = [
        'WEBSITE HEADER\nContent for page 1\nMore content for page 1\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 2\nMore content for page 2\nWEBSITE FOOTER',
        'DIFFERENT HEADER\nContent for page 3\nMore content for page 3\nDIFFERENT FOOTER'
      ];
      expect(removeHeadersFooters(pages, 0.8)).toEqual(expectedHighThreshold);
    });

    it('should handle pages with different line counts', () => {
      const pages = [
        'WEBSITE HEADER\nContent for page 1\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 2\nMore content for page 2\nWEBSITE FOOTER',
        'WEBSITE HEADER\nContent for page 3\nMore content for page 3\nEven more content\nWEBSITE FOOTER'
      ];

      const expected = [
        'Content for page 1',
        'Content for page 2\nMore content for page 2',
        'Content for page 3\nMore content for page 3\nEven more content'
      ];

      expect(removeHeadersFooters(pages)).toEqual(expected);
    });

    it('should handle pages with no common elements', () => {
      const pages = [
        'Unique content for page 1\nMore unique content for page 1',
        'Unique content for page 2\nMore unique content for page 2',
        'Unique content for page 3\nMore unique content for page 3'
      ];

      // No common elements, so output should be the same as input
      expect(removeHeadersFooters(pages)).toEqual(pages);
    });

    it('should handle empty lines and whitespace correctly', () => {
      const pages = [
        'WEBSITE HEADER\n\nContent for page 1\n\nWEBSITE FOOTER',
        'WEBSITE HEADER\n\nContent for page 2\n\nWEBSITE FOOTER',
        'WEBSITE HEADER\n\nContent for page 3\n\nWEBSITE FOOTER'
      ];

      const expected = [
        '\nContent for page 1\n',
        '\nContent for page 2\n',
        '\nContent for page 3\n'
      ];

      expect(removeHeadersFooters(pages)).toEqual(expected);
    });
  });
});