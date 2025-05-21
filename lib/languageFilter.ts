/**
 * Language Filter Module
 * Detects and filters content to only include English text.
 * Uses a lightweight heuristic based on common English stopwords and character patterns.
 * 
 * Exports:
 *   - filterEnglishText(text: string): string
 *   - filterEnglishLines(lines: string[]): string[]
 * 
 * Security: No external API calls. No sensitive data is logged.
 * Performance: Optimized for batch processing of text blocks.
 */

const ENGLISH_STOPWORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at"
];

/**
 * Checks if a line of text is likely to be English.
 * Heuristic: Must contain at least 2 English stopwords and >60% ASCII letters.
 */
function isEnglish(line: string): boolean {
  if (!line || line.trim().length < 10) return false;

  const lower = line.toLowerCase();
  let stopwordCount = 0;
  for (const word of ENGLISH_STOPWORDS) {
    if (lower.includes(` ${word} `) || lower.startsWith(`${word} `) || lower.endsWith(` ${word}`)) {
      stopwordCount++;
      if (stopwordCount >= 2) break;
    }
  }

  // ASCII letter ratio
  const asciiLetters = (line.match(/[a-zA-Z]/g) || []).length;
  const totalChars = line.replace(/\s/g, '').length;
  const asciiRatio = totalChars > 0 ? asciiLetters / totalChars : 0;

  return stopwordCount >= 2 && asciiRatio > 0.6;
}

/**
 * Filters a block of text, returning only lines likely to be English.
 * @param text - Input text (may be multi-line)
 * @returns Filtered text (English lines joined by newline)
 */
export function filterEnglishText(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  const englishLines = lines.filter(isEnglish);
  return englishLines.join('\n');
}

/**
 * Filters an array of text lines, returning only English lines.
 * @param lines - Array of text lines
 * @returns Array of English lines
 */
export function filterEnglishLines(lines: string[]): string[] {
  if (!Array.isArray(lines)) return [];
  return lines.filter(isEnglish);
}