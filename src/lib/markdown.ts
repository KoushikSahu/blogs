import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';

export interface RenderedPost {
  html: string;
  headings: { depth: number; text: string; id: string }[];
}

function normalizePath(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (out.length > 0) out.pop();
    } else {
      out.push(seg);
    }
  }
  return out.join('/');
}

/**
 * Rewrites relative img/video src attributes to the built asset mirror
 * (`<base>/assets/<repo-relative path>`). Absolute URLs, anchors and
 * data: URIs are left untouched. Runs before rehype-slug and rehype-katex.
 */
function rehypeRewriteAssetUrls(relPath: string) {
  const dir = relPath.split('/').slice(0, -1).join('/');
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img' && node.tagName !== 'video') return;
      const src = node.properties?.src;
      if (typeof src !== 'string') return;
      if (/^(?:[a-z]+:|\/|#|data:)/i.test(src)) return;
      const resolved = (dir ? dir + '/' : '') + src;
      node.properties.src = import.meta.env.BASE_URL + 'assets/' + normalizePath(resolved);
    });
  };
}

function headingText(node: Element): string {
  return node.children
    .map((child) => {
      if (child.type === 'text') return child.value;
      if (child.type === 'element') {
        if (child.tagName === 'code') {
          return child.children.map((c) => (c.type === 'text' ? c.value : '')).join('');
        }
        const nested = child.children.find((c) => c.type === 'text');
        return nested ? nested.value : '';
      }
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function renderMarkdown(source: string, relPath: string): Promise<RenderedPost> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeRewriteAssetUrls, relPath)
    .use(rehypeSlug)
    .use(rehypePrettyCode, { theme: 'github-light', keepBackground: false });

  const tree = (await processor.run(processor.parse(source) as Root)) as Root;

  const headings: { depth: number; text: string; id: string }[] = [];
  visit(tree, 'element', (node: Element) => {
    const m = /^h([1-4])$/.exec(node.tagName);
    if (!m) return;
    const id = typeof node.properties?.id === 'string' ? node.properties.id : '';
    headings.push({ depth: Number(m[1]), text: headingText(node), id });
  });

  const stringifier = unified()
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true });
  const html = stringifier.stringify(await stringifier.run(tree));

  return { html, headings };
}
