/**
 * Header/Footer Remover Module
 * Identifies and removes repetitive elements (headers, footers, navigation) across multiple pages.
 *
 * Exports:
 *   - removeHeadersFooters(pages: string[]): string[]
 *
 * Security: No external API calls. No sensitive data is logged.
 * Performance: Optimized for batch processing of text blocks.
 */

type LineFrequencyMap = Map<string, number>;

/**
 * Finds lines that are repeated in a high percentage of pages.
 * @param pages - Array of page text (each as a string)
 * @param threshold - Fraction of pages a line must appear in to be considered repetitive (default: 0.6)
 * @returns Set of repetitive lines
 */
function findRepetitiveLines(pages: string[], threshold: number = 0.6): Set<string> {
  const lineCounts: LineFrequencyMap = new Map();
  const totalPages = pages.length;

  for (const page of pages) {
    const seen = new Set<string>();
    const lines = page.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!seen.has(line)) {
        lineCounts.set(line, (lineCounts.get(line) || 0) + 1);
        seen.add(line);
      }
    }
  }

  const repetitiveLines = new Set<string>();
  for (const [line, count] of lineCounts.entries()) {
    if (count / totalPages >= threshold) {
      repetitiveLines.add(line);
    }
  }
  return repetitiveLines;
}

/**
 * Removes repetitive lines (headers/footers/navigation) from each page.
 * @param pages - Array of page text (each as a string)
 * @param threshold - Fraction of pages a line must appear in to be considered repetitive (default: 0.6)
 * @returns Array of cleaned page text
 */
export function removeHeadersFooters(pages: string[], threshold: number = 0.6): string[] {
  if (!Array.isArray(pages) || pages.length === 0) return [];

  const repetitiveLines = findRepetitiveLines(pages, threshold);

  return pages.map(page => {
    const lines = page.split(/\r?\n/);
    const filtered = lines.filter(line => !repetitiveLines.has(line.trim()));
    return filtered.join('\n');
  });
}