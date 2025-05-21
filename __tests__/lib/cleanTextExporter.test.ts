import { exportCleanText } from '../../lib/cleanTextExporter';

describe('Clean Text Exporter Module', () => {
  describe('exportCleanText', () => {
    it('should return an empty string when input is empty', () => {
      expect(exportCleanText('')).toBe('');
      expect(exportCleanText('   ')).toBe('');
      expect(exportCleanText(null as any)).toBe('');
      expect(exportCleanText(undefined as any)).toBe('');
    });

    it('should trim leading/trailing whitespace from each line', () => {
      const text = '  Line with leading spaces\nLine with trailing spaces   \n   Both   ';
      const expected = 'Line with leading spaces\nLine with trailing spaces\nBoth';
      
      expect(exportCleanText(text)).toBe(expected);
    });

    it('should collapse multiple blank lines to a single blank line', () => {
      const text = 'First paragraph\n\n\n\nSecond paragraph\n\n\nThird paragraph';
      const expected = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
      
      expect(exportCleanText(text)).toBe(expected);
    });

    it('should remove lines that are only whitespace', () => {
      const text = 'First line\n   \n\t\n \t \nSecond line';
      const expected = 'First line\n\nSecond line';
      
      expect(exportCleanText(text)).toBe(expected);
    });

    it('should normalize paragraph breaks', () => {
      const text = 'Paragraph 1\nStill paragraph 1\n\nParagraph 2\n\n\nParagraph 3';
      const expected = 'Paragraph 1\nStill paragraph 1\n\nParagraph 2\n\nParagraph 3';
      
      expect(exportCleanText(text)).toBe(expected);
    });

    it('should handle complex text with mixed formatting issues', () => {
      const text = '  First line  \n' +
                   '  \n' +
                   '\n' +
                   'Second line\n' +
                   '\n\n\n' +
                   '  Third line with spaces  \n' +
                   '    \n' +
                   'Fourth line';
      
      const expected = 'First line\n\n' +
                       'Second line\n\n' +
                       'Third line with spaces\n\n' +
                       'Fourth line';
      
      expect(exportCleanText(text)).toBe(expected);
    });

    it('should handle text with Unicode characters', () => {
      // Text with Unicode characters and combining marks
      const text = 'café\n' +
                   'résumé\n' +
                   'naïve';
      
      // Should be normalized to NFC form
      expect(exportCleanText(text)).toBe('café\nrésumé\nnaïve');
    });
  });
});