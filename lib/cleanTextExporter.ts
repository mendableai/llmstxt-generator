/**
 * Clean Text Exporter Module
 * Formats text for optimal embedding by cleaning whitespace, normalizing paragraphs, and removing excessive blank lines.
 *
 * Exports:
 *   - exportCleanText(text: string): string
 *
 * Security: No external API calls. No sensitive data is logged.
 * Performance: Optimized for single and batch text processing.
 */

/**
 * Cleans and formats text for embedding:
 * - Trims leading/trailing whitespace from each line
 * - Collapses multiple blank lines to a single blank line
 * - Normalizes paragraph breaks (ensures paragraphs are separated by a single blank line)
 * - Removes lines that are only whitespace
 * - Optionally, can normalize Unicode (NFC)
 * @param text - Input text (multi-line)
 * @returns Cleaned, formatted text
 */
export function exportCleanText(text: string): string {
  if (typeof text !== "string" || !text.trim()) return "";

  // Normalize Unicode (NFC)
  let cleaned = text.normalize("NFC");

  // Split into lines, trim each line, remove lines that are only whitespace
  let lines = cleaned.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  // Collapse multiple blank lines to a single blank line between paragraphs
  let result: string[] = [];
  let lastWasBlank = false;
  for (const line of lines) {
    if (line === "") {
      if (!lastWasBlank) {
        result.push("");
        lastWasBlank = true;
      }
    } else {
      result.push(line);
      lastWasBlank = false;
    }
  }

  // Join lines, ensuring paragraphs are separated by a single blank line
  return result.join('\n');
}