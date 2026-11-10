import type { CollectionEntry } from 'astro:content';

export interface HasEntry {
  id: string;
  data: { entry: number; draft: boolean; featured: boolean };
}

export function published<T extends { data: { draft: boolean } }>(
  items: T[],
): T[] {
  return items.filter((i) => !i.data.draft);
}

export function byEntryDesc<T extends HasEntry>(items: T[]): T[] {
  return [...items].sort((a, b) => b.data.entry - a.data.entry);
}

export function featured<T extends HasEntry>(items: T[]): T[] {
  return byEntryDesc(published(items).filter((i) => i.data.featured));
}

/** Next lower entry, wrapping to the highest; null when fewer than 2 published projects. */
export function nextProject<T extends HasEntry>(
  items: T[],
  id: string,
): T | null {
  const sorted = byEntryDesc(published(items));
  if (sorted.length < 2) return null;
  const i = sorted.findIndex((p) => p.id === id);
  if (i === -1) return null;
  return sorted[(i + 1) % sorted.length] ?? null;
}

export function duplicateEntries(entries: number[]): number[] {
  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const e of entries) {
    if (seen.has(e)) dupes.add(e);
    seen.add(e);
  }
  return [...dupes];
}

/** The only function that touches the content collections. */
export async function loadSiteContent(): Promise<{
  projects: CollectionEntry<'projects'>[];
  notes: CollectionEntry<'notes'>[];
  showNotes: boolean;
}> {
  const { getCollection } = await import('astro:content');
  const projects = byEntryDesc(published(await getCollection('projects')));
  const notes = published(await getCollection('notes')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
  return { projects, notes, showNotes: notes.length > 0 };
}
