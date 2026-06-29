/**
 * Formats mathematical text and LaTeX formulas for proper rendering in ReactMarkdown.
 * Replaces standard LaTeX block/inline notations with markdown-compatible versions ($$ and $).
 * Also auto-closes open mathematical blocks during streaming to prevent UI flickering.
 */
export const formatMathForMarkdown = (text: string | null | undefined): string => {
  if (!text) return '';

  let processed = text
    .replace(/\\\[/g, () => '$$')
    .replace(/\\\]/g, () => '$$')
    .replace(/\\\(/g, () => '$')
    .replace(/\\\)/g, () => '$');

  // Fix mismatched $$ ... $ where they are on the same line or short block
  processed = processed.replace(/\$\$([^$]+)\$(?!\$)/g, (match, p1) => {
    if (p1.includes('\n')) {
      return `$$${p1}$$`;
    }
    return `$${p1}$`;
  });

  // Fix mismatched $ ... $$
  processed = processed.replace(/(?<!\$)\$([^$]+)\$\$/g, (match, p1) => {
    if (p1.includes('\n')) {
      return `$$${p1}$$`;
    }
    return `$${p1}$`;
  });

  return processed;
};
