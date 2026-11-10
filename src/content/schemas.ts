import { z } from 'astro/zod';

export const projectSchema = z.object({
  title: z.string(),
  entry: z.number().int(),
  year: z.number().int(),
  summary: z.string().max(160),
  tags: z.array(z.string()).min(1),
  problem: z.string(),
  approach: z.string(),
  result: z.string(),
  demo: z
    .enum(['mnist', 'saved-runs', 'video', 'image', 'none'])
    .default('none'),
  image: z.object({ src: z.string(), alt: z.string().min(1) }).optional(),
  featured: z.boolean().default(false),
  repo: z.url(),
  live: z.url().optional(),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
});

export const noteSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  summary: z.string().max(160),
  project: z.string().optional(),
  draft: z.boolean().default(false),
});
