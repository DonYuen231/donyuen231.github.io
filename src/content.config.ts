import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { noteSchema, projectSchema } from './content/schemas';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: noteSchema.extend({ project: reference('projects').optional() }),
});

export const collections = { projects, notes };
