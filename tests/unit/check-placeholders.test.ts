import { describe, expect, it } from 'vitest';
import { findPlaceholders } from '../../scripts/check-placeholders.mjs';

describe('findPlaceholders', () => {
  it('finds bracketed upper-case placeholders in text', () => {
    expect(findPlaceholders('<p>[EMAIL] and [YEAR]</p>')).toEqual([
      '[EMAIL]',
      '[YEAR]',
    ]);
  });

  it('ignores array indexing and regexes in scripts', () => {
    expect(findPlaceholders('<p>a[0] x</p>')).toEqual([]);
    expect(
      findPlaceholders('<script>const r = /[A-Z]+/; var x = [FOO];</script>'),
    ).toEqual([]);
    expect(findPlaceholders('<style>a[HREF] {}</style>')).toEqual([]);
  });

  it('ignores mixed-case citations', () => {
    expect(findPlaceholders('<a>[Fig. 1]</a>')).toEqual([]);
  });
});
