const text = `For total internal reflection to occur, the angle of incidence must be greater than the critical angle (\\theta_c), which is given by: $$\\sin(\\theta_c) = \\frac{n_1}{n_2}$ Using the values for n1 and n2: \\sin(\\theta_c) = \\frac{1.0}{1.57}$ \\sin(\\theta_c) \\approx 0.6376 $$\\theta_c = \\arcsin(0.6376) $$\\theta_c \\approx 39.44^\\circ$ Since the angle...`;

function formatMathForMarkdown(text) {
  if (!text) return '';

  let processed = text
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  // Fix mismatched $$ ... $ 
  // It looks for $$ followed by any non-$ characters, followed by a single $ (that is not part of $$)
  processed = processed.replace(/\$\$([^$]+)\$(?!\$)/g, (match, p1) => {
    // If it contains a newline, it's a block, make it $$...$$
    if (p1.includes('\\n')) {
      return '$$' + p1 + '$$';
    }
    // Otherwise make it inline $...$
    return '$' + p1 + '$';
  });

  // Fix mismatched $ ... $$
  processed = processed.replace(/(?<!\$)\$([^$]+)\$\$/g, (match, p1) => {
    if (p1.includes('\\n')) {
      return '$$' + p1 + '$$';
    }
    return '$' + p1 + '$';
  });
  
  // What about `\sin(\theta_c) = \frac{1.0}{1.57}$`?
  // It has a trailing $ but no opening $.
  // If we just remove the streaming auto-close, remark-math will ignore the trailing $ and render as plain text.
  // Let's remove the streaming auto-close for now to see if it's safer.

  return processed;
}

console.log("ORIGINAL:\n", text);
console.log("\nPROCESSED:\n", formatMathForMarkdown(text));
