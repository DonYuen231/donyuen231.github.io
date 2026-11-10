import { describe, expect, it } from 'vitest';
import {
  byEntryDesc,
  duplicateEntries,
  featured,
  nextProject,
  published,
} from '../../src/lib/content';

const mk = (id: string, entry: number, draft = false, feat = false) => ({
  id,
  data: { entry, draft, featured: feat },
});

describe('content helpers', () => {
  it('byEntryDesc orders highest first without mutating', () => {
    const input = [mk('a', 1), mk('b', 3), mk('c', 2)];
    expect(byEntryDesc(input).map((p) => p.data.entry)).toEqual([3, 2, 1]);
    expect(input.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('published drops drafts', () => {
    expect(published([mk('a', 1), mk('b', 2, true)]).map((p) => p.id)).toEqual([
      'a',
    ]);
  });
  it('featured drops drafts and non-featured', () => {
    const items = [
      mk('a', 1, false, true),
      mk('b', 2, true, true),
      mk('c', 3),
      mk('d', 4, false, true),
    ];
    expect(featured(items).map((p) => p.id)).toEqual(['d', 'a']);
  });
  it('nextProject goes to the next lower entry and wraps', () => {
    const items = [mk('a', 3), mk('b', 2), mk('c', 1)];
    expect(nextProject(items, 'a')?.data.entry).toBe(2);
    expect(nextProject(items, 'c')?.data.entry).toBe(3);
  });
  it('nextProject is null with fewer than 2 published projects', () => {
    expect(nextProject([mk('a', 1)], 'a')).toBeNull();
    expect(nextProject([mk('a', 1), mk('b', 2, true)], 'a')).toBeNull();
  });
  it('duplicateEntries lists repeated entries', () => {
    expect(duplicateEntries([1, 2, 2, 3, 3])).toEqual([2, 3]);
    expect(duplicateEntries([1, 2])).toEqual([]);
  });
});
