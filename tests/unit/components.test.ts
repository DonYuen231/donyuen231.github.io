import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ImageMetadata } from 'astro';
import ProjectCard from '../../src/components/ProjectCard.astro';
import ProblemApproachResult from '../../src/components/ProblemApproachResult.astro';
import Figure from '../../src/components/Figure.astro';

const project = {
  id: 'demo-proj',
  collection: 'projects',
  data: {
    title: 'Demo Project',
    entry: 3,
    year: 2026,
    summary: 'A short summary.',
    tags: ['python'],
    problem: 'Hard problem',
    approach: 'Clever approach',
    result: '**98%** done',
    demo: 'none',
    featured: false,
    repo: 'https://github.com/DonYuen231/demo',
    draft: false,
  },
} as never;

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('ProjectCard', () => {
  it('renders the full variant', async () => {
    const html = await container.renderToString(ProjectCard, {
      props: { project, variant: 'full' },
    });
    expect(html).toContain('Entry 03');
    expect(html).toMatch(/<h3[^>]*>\s*<a[^>]*href="\/projects\/demo-proj\/"/);
    expect(html).toContain('<strong>98%</strong>');
    expect(html).toContain('Open project');
    expect(html).toContain('View the code');
    expect(html).toMatch(/data-astro-transition-scope="[^"]+"/);
    expect(html.trim()).not.toMatch(/^<a[\s>]/);
    expect(html.match(/data-astro-transition-scope=/g)).toHaveLength(2);
  });

  it('renders the compact variant without P/A/R or buttons', async () => {
    const html = await container.renderToString(ProjectCard, {
      props: { project, variant: 'compact' },
    });
    expect(html).not.toContain('<dl');
    expect(html).not.toContain('Open project');
    expect(html).toContain('A short summary.');
    expect(html).toContain('2026');
  });
});

describe('ProblemApproachResult', () => {
  it('renders three dt labels', async () => {
    const html = await container.renderToString(ProblemApproachResult, {
      props: { problem: 'p', approach: 'a', result: 'r' },
    });
    const dts = [...html.matchAll(/<dt[^>]*>([^<]*)<\/dt>/g)].map((m) =>
      m[1]!.trim(),
    );
    expect(dts).toEqual(['Problem', 'Approach', 'Result']);
  });
});

describe('Figure', () => {
  it('renders figure.fig with caption and alt', async () => {
    const src: ImageMetadata = {
      src: '/x.png',
      width: 100,
      height: 50,
      format: 'png',
    };
    const html = await container.renderToString(Figure, {
      props: { src, alt: 'An alt', caption: 'My caption' },
    });
    expect(html).toMatch(/<figure[^>]*class="[^"]*\bfig\b/);
    expect(html).toMatch(
      /<figcaption[^>]*>[\s\S]*My caption[\s\S]*<\/figcaption>/,
    );
    expect(html).toContain('alt="An alt"');
  });
});
