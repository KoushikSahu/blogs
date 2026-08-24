import manifest from '../generated/manifest.json' with { type: 'json' };
import loaders from '../generated/loaders.mjs';

export interface ContentEntry {
  relPath: string;
  slug: string;
  title: string;
  body: string;
}

export interface TreeEntry {
  name: string;
  children?: TreeEntry[];
  entry?: ContentEntry;
}

export const posts: ContentEntry[] = manifest.posts;

/** Raw markdown source for a slug, or undefined when the slug does not exist. */
export function getPostSource(slug: string): string | undefined {
  return (loaders as Record<string, string>)[slug];
}

/** Nested tree from slug segments; directories first, then files, alphabetical. */
export function buildTree(entries: ContentEntry[]): TreeEntry[] {
  const root: TreeEntry[] = [];
  for (const entry of entries) {
    const segments = entry.slug.split('/');
    let level = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i];
      let node = level.find((n) => n.name === name && n.children);
      if (!node) {
        node = { name, children: [] };
        level.push(node);
      }
      level = node.children!;
    }
    level.push({ name: segments[segments.length - 1], entry });
  }
  const sortLevel = (nodes: TreeEntry[]): TreeEntry[] => {
    const dirs = nodes.filter((n) => n.children).sort((a, b) => (a.name < b.name ? -1 : 1));
    const files = nodes.filter((n) => n.entry).sort((a, b) => (a.name < b.name ? -1 : 1));
    return [...dirs, ...files].map((n) => (n.children ? { ...n, children: sortLevel(n.children) } : n));
  };
  return sortLevel(root);
}
