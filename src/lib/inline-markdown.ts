const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Escapes everything, then supports only **bold** and [text](http(s)://… or /…) links. */
export function inlineMarkdown(src: string): string {
  return escapeHtml(src)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]*)\)/g,
      (_m, text: string, href: string) => `<a href="${href}">${text}</a>`,
    );
}
