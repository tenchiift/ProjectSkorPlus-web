// Strip Markdown symbols so AI replies show as normal plain text.
// Keeps line breaks + numbered lists (1. 2. 3.) readable.
export function stripMarkdown(text) {
  if (typeof text !== 'string') return text || '';
  let out = text;
  // code fences ```...``` -> keep inner content
  out = out.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // inline code `x` -> x
  out = out.replace(/`([^`]*)`/g, '$1');
  // images ![alt](url) -> alt
  out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  // links [text](url) -> text
  out = out.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // headings ### x -> x
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  // bold/italic: **x** __x__ *x* _x_ ~~x~~ -> x
  out = out.replace(/(\*\*|__)(.*?)\1/g, '$2');
  out = out.replace(/~~(.*?)~~/g, '$1');
  // leftover stray asterisks/underscores used as bullets (* item) -> keep text
  out = out.replace(/^\s*[*\-+]\s+/gm, '');
  out = out.replace(/\*/g, '');
  // blockquotes
  out = out.replace(/^\s{0,3}>\s?/gm, '');
  // collapse 3+ blank lines to max 2
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}
