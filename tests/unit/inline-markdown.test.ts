import { describe, expect, it } from 'vitest';
import { inlineMarkdown } from '../../src/lib/inline-markdown';

describe('inlineMarkdown', () => {
  it('converts bold', () => {
    expect(inlineMarkdown('**98.32%** on')).toBe('<strong>98.32%</strong> on');
  });
  it('escapes html', () => {
    expect(inlineMarkdown('<script>')).toBe('&lt;script&gt;');
  });
  it('converts https links', () => {
    expect(inlineMarkdown('[code](https://x.dev)')).toBe(
      '<a href="https://x.dev">code</a>',
    );
  });
  it('converts root-relative links', () => {
    expect(inlineMarkdown('[a](/projects/)')).toBe(
      '<a href="/projects/">a</a>',
    );
  });
  it('leaves javascript: links as escaped text', () => {
    const out = inlineMarkdown('[x](javascript:alert(1))');
    expect(out).not.toContain('<a');
    expect(out).toBe('[x](javascript:alert(1))');
  });
  it('cannot break out of the href attribute', () => {
    const out = inlineMarkdown('[x](https://a.dev/"onmouseover="y)');
    expect(out).toMatch(/^<a href="[^"]*">x<\/a>$/);
  });
});
