import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://donyuen231.github.io',
  trailingSlash: 'always',
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (p) => !p.includes('/404') }),
  ],
});
