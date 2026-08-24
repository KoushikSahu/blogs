// Build-time content generator.
// Walks blogs/ with fs (no git invocation), emits:
//   src/generated/manifest.json — { "posts": [{ relPath, slug, title, body }] } sorted by slug
//   src/generated/loaders.mjs    — static ?raw imports of every post, keyed by slug
// and copies every media file under blogs/ into public/assets/<relPath>.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BLOGS = path.join(ROOT, 'blogs');
const GENERATED_DIR = path.join(ROOT, 'src', 'generated');
const PUBLIC_ASSETS = path.join(ROOT, 'public', 'assets');

const MEDIA_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.mp4', '.webm', '.mov', '.m4v', '.pdf']);

const toPosix = (p) => p.split(path.sep).join('/');

/** True when no path segment starts with '.' (hides dotfiles/dot-dirs). */
function noDotSegments(relPath) {
  return relPath.split(path.sep).every((seg) => !seg.startsWith('.'));
}

/** Inline plain text of a heading: strip links, images, code, emphasis, entities. */
function inlinePlainText(line) {
  let text = line;
  const strip = (re, g = 1) => { text = text.replace(re, (m, ...args) => args[g - 1]); };
  strip(/!\[([^\]]*)\]\([^)]*\)/g); // image with url -> alt
  strip(/!\[([^\]]*)\]\[[^\]]*\]/g); // image with ref -> alt
  strip(/\[([^\]]*)\]\([^)]*\)/g); // link with url -> text
  strip(/\[([^\]]*)\]\[[^\]]*\]/g); // link with ref -> text
  strip(/`([^`]+)`/g); // inline code
  strip(/~~([^~]+)~~/g); // strikethrough
  strip(/\*\*\*([^*]+)\*\*\*/g); strip(/___([^_]+)___/g); // bold+italic
  strip(/\*\*([^*]+)\*\*/g); strip(/__([^_]+)__/g); // bold
  strip(/\*([^*]+)\*/g); strip(/_([^_]+)_/g); // italic
  text = text.replace(/<[^>]+>/g, ''); // raw html / autolinks
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Searchable plaintext of a post body. Strips code, markup, and emphasis so
 * fuzzy search indexes prose, not syntax. Order matters (see steps).
 */
function bodyStripper(source) {
  let text = source;
  // 1. Fenced code blocks (``` and ~~~) — noise for search.
  text = text.replace(/```[\s\S]*?(?:```|$)/g, ' ');
  text = text.replace(/~~~[\s\S]*?(?:~~~|$)/g, ' ');
  // 2. Inline code.
  text = text.replace(/`[^`\n]*`/g, ' ');
  // 3. Math blocks (multiline-safe) — KaTeX source is noise.
  text = text.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  // 4. HTML tags.
  text = text.replace(/<[^>]+>/g, ' ');
  // 5. Images -> space; links -> anchor text.
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/!\[[^\]]*\]\[[^\]]*\]/g, ' ');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  text = text.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');
  // 6. Line-level markers: ATX headings, blockquotes, list bullets, HRs.
  text = text.replace(/^#{1,6}\s+/gm, ' ');
  text = text.replace(/^>\s?/gm, ' ');
  text = text.replace(/^\s*[-*+]\s+/gm, ' ');
  text = text.replace(/^\s*\d+\.\s+/gm, ' ');
  text = text.replace(/^(-{3,}|\*{3,})\s*$/gm, ' ');
  // 7. Emphasis/strikethrough markers.
  text = text.replace(/\*\*|__|\*|_|~~/g, '');
  // 8. Collapse whitespace.
  return text.replace(/\s+/g, ' ').trim();
}

function titleFromSource(source) {
  for (const line of source.split('\n')) {
    const m = /^#\s+(.+)$/.exec(line);
    if (m) {
      const title = inlinePlainText(m[1]);
      if (title) return title;
    }
  }
  return null;
}

function humanize(basename) {
  const words = basename.replace(/\.md$/i, '').split(/[_\-\s]+/).filter(Boolean);
  if (words.length === 0) return basename;
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}

function walkFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.startsWith('.')) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walkFiles(full));
      else if (entry.isFile()) out.push(full);
    }
  }
  return out;
}

if (!fs.existsSync(BLOGS)) {
  console.log('note: blogs/ not found — treating as empty (manifest + loaders still generated)');
}

const posts = [];
const media = [];
if (fs.existsSync(BLOGS)) {
  for (const file of walkFiles(BLOGS)) {
    const rel = path.relative(BLOGS, file);
    if (!noDotSegments(rel)) continue;
    if (/\.md$/i.test(rel)) {
      const source = fs.readFileSync(file, 'utf8');
      const slug = toPosix(rel.replace(/\.md$/i, ''));
      const title = titleFromSource(source) ?? humanize(path.basename(rel));
      posts.push({ relPath: toPosix(path.relative(ROOT, file)), slug, title, body: bodyStripper(source) });
    } else if (MEDIA_EXTENSIONS.has(path.extname(rel).toLowerCase())) {
      media.push({ file, relPath: toPosix(path.relative(ROOT, file)) });
    }
  }
}

posts.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

// Media mirror under public/assets/<relPath>.
for (const { file, relPath } of media) {
  const dest = path.join(PUBLIC_ASSETS, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

// Generated artifacts.
fs.mkdirSync(GENERATED_DIR, { recursive: true });
fs.writeFileSync(path.join(GENERATED_DIR, 'manifest.json'), JSON.stringify({ posts }, null, 2) + '\n');

const importLines = posts.map((post, i) => `import raw_${i} from '/${post.relPath}?raw';`);
const mapEntries = posts.map((post, i) => `  ${JSON.stringify(post.slug)}: raw_${i},`);
const loaders = [
  ...importLines,
  '',
  'export default {',
  ...mapEntries,
  '};',
  '',
].join('\n');
fs.writeFileSync(path.join(GENERATED_DIR, 'loaders.mjs'), loaders);

console.log(`generated manifest: ${posts.length} post(s), ${media.length} media file(s) copied`);
