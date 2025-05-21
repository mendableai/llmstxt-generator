import { filterEnglishText, filterEnglishLines } from '../../lib/languageFilter';

describe('Language Filter Module', () => {
  // Tests for filterEnglishText function
  describe('filterEnglishText', () => {
    it('should return an empty string when input is empty', () => {
      expect(filterEnglishText('')).toBe('');
      expect(filterEnglishText(null as any)).toBe('');
      expect(filterEnglishText(undefined as any)).toBe('');
    });

    it('should filter out non-English lines', () => {
      const mixedText = 
        'This is an English line with common words.\n' +
        'Lorem ipsum dolor sit amet.\n' +  // Latin, should be filtered out
        'Another English line with the and have words.\n' +
        '这是中文，应该被过滤掉。\n' +  // Chinese, should be filtered out
        'English text with stopwords like the, and, to, of.';
      
      const expected = 
        'This is an English line with common words.\n' +
        'Another English line with the and have words.\n' +
        'English text with stopwords like the, and, to, of.';
      
      expect(filterEnglishText(mixedText)).toBe(expected);
    });

    it('should filter out short lines (less than 10 chars)', () => {
      const text = 
        'Short.\n' +
        'This is a longer English line that should be kept.\n' +
        'Hi there.';
      
      const expected = 'This is a longer English line that should be kept.';
      
      expect(filterEnglishText(text)).toBe(expected);
    });

    it('should require at least 2 English stopwords', () => {
      const text = 
        'This sentence has multiple stopwords and should be kept.\n' +
        'Unique words only here zero common stopwords.\n' + // No common stopwords
        'The cat.'; // Only one stopword
      
      const expected = 'This sentence has multiple stopwords and should be kept.';
      
      expect(filterEnglishText(text)).toBe(expected);
    });

    it('should require >60% ASCII letters', () => {
      const text = 
        'Normal English text with stopwords like the and to.\n' +
        'Text with too many symbols: !@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./\n' + // Too many symbols
        'The quick brown fox jumps over the lazy dog.';
      
      const expected = 
        'Normal English text with stopwords like the and to.\n' +
        'The quick brown fox jumps over the lazy dog.';
      
      expect(filterEnglishText(text)).toBe(expected);
    });
  });

  // Tests for filterEnglishLines function
  describe('filterEnglishLines', () => {
    it('should return an empty array when input is empty', () => {
      expect(filterEnglishLines([])).toEqual([]);
      expect(filterEnglishLines(null as any)).toEqual([]);
      expect(filterEnglishLines(undefined as any)).toEqual([]);
    });

    it('should filter out non-English lines', () => {
      const mixedLines = [
        'This is an English line with common words.',
        'Lorem ipsum dolor sit amet.',  // Latin, should be filtered out
        'Another English line with the and have words.',
        '这是中文，应该被过滤掉。',  // Chinese, should be filtered out
        'English text with stopwords like the, and, to, of.'
      ];
      
      const expected = [
        'This is an English line with common words.',
        'Another English line with the and have words.',
        'English text with stopwords like the, and, to, of.'
      ];
      
      expect(filterEnglishLines(mixedLines)).toEqual(expected);
    });

    it('should filter out short lines (less than 10 chars)', () => {
      const lines = [
        'Short.',
        'This is a longer English line that should be kept.',
        'Hi there.'
      ];
      
      const expected = ['This is a longer English line that should be kept.'];
      
      expect(filterEnglishLines(lines)).toEqual(expected);
    });
  });
});