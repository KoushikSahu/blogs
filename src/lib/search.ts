/**
 * Dependency-free fuzzy search over post titles and bodies.
 * Pure module: no DOM access; safe to import from both bundled client
 * scripts and build-time code.
 */

export interface SearchDoc {
  slug: string;
  title: string;
  body: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  score: number;
  /** Character indices into `title` matched by the query (for <mark>). */
  titleMatches: number[];
  /** Number of characters matched in `body`. */
  bodyMatches: number;
  /** ~160-char excerpt centered on the first body match, `…`-trimmed. */
  snippet: string | null;
}

const SNIPPET_RADIUS = 80;

/** True when `i` starts a word in `target` (case-insensitive scan uses lowercased input). */
function isWordBoundaryStart(target: string, i: number): boolean {
  return i === 0 || /\s/.test(target[i - 1]);
}

/**
 * Case-insensitive subsequence match. Returns the matched character indices
 * into `target`, or null when `query` cannot be matched in order.
 * Scoring: consecutive matches +2, word-boundary starts +3, earlier
 * position gets a small bonus (0..1 per char).
 */
export function fuzzyScore(query: string, target: string): number[] | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  const matches: number[] = [];
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = -1;
    for (let j = ti; j < t.length; j++) {
      if (t[j] === ch) {
        found = j;
        break;
      }
    }
    if (found === -1) return null;
    matches.push(found);
    ti = found + 1;
  }

  let score = 0;
  let prev = -2;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (i > 0 && m === prev + 1) score += 2; // consecutive run
    if (isWordBoundaryStart(t, m)) score += 3; // word-boundary start
    score += Math.max(0, 1 - m / t.length); // earlier position bonus
    prev = m;
  }
  return matches;
}

/** Excerpt around `firstMatch`, snapped to word boundaries, `…`-trimmed when clipped. */
function makeSnippet(body: string, firstMatch: number): string {
  let start = Math.max(0, firstMatch - SNIPPET_RADIUS);
  let end = Math.min(body.length, firstMatch + SNIPPET_RADIUS);
  if (start > 0) {
    const space = body.indexOf(' ', start);
    if (space !== -1 && space <= firstMatch) start = space + 1;
  }
  if (end < body.length) {
    const space = body.lastIndexOf(' ', end);
    if (space > firstMatch) end = space;
  }
  let snippet = body.slice(start, end);
  if (start > 0) snippet = `…${snippet}`;
  if (end < body.length) snippet = `${snippet}…`;
  return snippet;
}

/**
 * Rank docs by fuzzy match against title (weight ×10 per matched char) and
 * body (×1). Sorted by score desc, then slug asc. Empty query -> [].
 */
export function searchDocs(query: string, docs: SearchDoc[], limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const results: SearchResult[] = [];
  for (const doc of docs) {
    const titleMatches = fuzzyScore(q, doc.title);
    const bodyMatches = fuzzyScore(q, doc.body);
    if (!titleMatches && !bodyMatches) continue;

    let score = 0;
    if (titleMatches) score += titleMatches.length * 10;
    if (bodyMatches) score += bodyMatches.length;

    const snippet = bodyMatches && bodyMatches.length > 0 ? makeSnippet(doc.body, bodyMatches[0]) : null;
    results.push({
      slug: doc.slug,
      title: doc.title,
      score,
      titleMatches: titleMatches ?? [],
      bodyMatches: bodyMatches?.length ?? 0,
      snippet,
    });
  }

  results.sort((a, b) => b.score - a.score || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return results.slice(0, limit);
}
