import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { noteSchema, projectSchema } from '../../src/content/schemas';
import { duplicateEntries } from '../../src/lib/content';

const valid = {
  title: 'A neural network written from scratch',
  entry: 1,
  year: 2026,
  summary: 'MNIST digit classifier in NumPy with hand-derived backprop.',
  tags: ['python', 'numpy'],
  problem: 'Classify handwritten digits without using an ML framework.',
  approach: 'NumPy only. Backpropagation derived by hand.',
  result: '**98.32%** on the 10,000-image MNIST test set.',
  demo: 'mnist',
  featured: true,
  repo: 'https://github.com/DonYuen231/mnist-neural-network',
  draft: false,
};

describe('projectSchema', () => {
  it('parses the spec example', () => {
    expect(projectSchema.parse(valid).entry).toBe(1);
  });
  it('rejects a 161-character summary', () => {
    expect(() =>
      projectSchema.parse({ ...valid, summary: 'x'.repeat(161) }),
    ).toThrow();
    expect(
      projectSchema.parse({ ...valid, summary: 'x'.repeat(160) }),
    ).toBeTruthy();
  });
  it('rejects empty tags', () => {
    expect(() => projectSchema.parse({ ...valid, tags: [] })).toThrow();
  });
  it('rejects an image without alt', () => {
    expect(() =>
      projectSchema.parse({ ...valid, image: { src: '/a.png' } }),
    ).toThrow();
    expect(() =>
      projectSchema.parse({ ...valid, image: { src: '/a.png', alt: '' } }),
    ).toThrow();
  });
  it('defaults demo to none and rejects unknown demos', () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.demo;
    expect(projectSchema.parse(rest).demo).toBe('none');
    expect(() => projectSchema.parse({ ...valid, demo: 'gif' })).toThrow();
  });
  it('defaults featured and draft to false', () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest.featured;
    delete rest.draft;
    const out = projectSchema.parse(rest);
    expect(out.featured).toBe(false);
    expect(out.draft).toBe(false);
  });
});

describe('noteSchema', () => {
  it('parses a note with a project string', () => {
    const out = noteSchema.parse({
      title: 'T',
      date: '2026-11-09',
      summary: 's',
      project: 'mnist',
    });
    expect(out.draft).toBe(false);
    expect(out.date).toBeInstanceOf(Date);
  });
});

describe('project files', () => {
  it('no two project files share an entry', () => {
    const dir = join(process.cwd(), 'src/content/projects');
    const files = existsSync(dir)
      ? readdirSync(dir).filter((f) => f.endsWith('.mdx'))
      : [];
    const entries = files.map((f) => {
      const text = readFileSync(join(dir, f), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
      if (!match) throw new Error(`${f}: no frontmatter`);
      return projectSchema.parse(parse(match[1]!)).entry;
    });
    expect(duplicateEntries(entries)).toEqual([]);
  });
});
