import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = /\[[A-Z][A-Z0-9_ ]{1,40}\]/g;

/** Returns every [PLACEHOLDER]-style token outside <script> and <style> blocks. */
export function findPlaceholders(html) {
  const stripped = html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    '',
  );
  return stripped.match(PLACEHOLDER) ?? [];
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (name.endsWith('.html')) yield path;
  }
}

function main() {
  const root = resolve('dist');
  let found = 0;
  for (const file of walk(root)) {
    for (const match of findPlaceholders(readFileSync(file, 'utf8'))) {
      console.log(`${file}: ${match}`);
      found++;
    }
  }
  if (found > 0) {
    console.error(`check:placeholders: ${found} placeholder(s) found`);
    process.exit(1);
  }
  console.log('check:placeholders: none found');
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main();
