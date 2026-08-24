# blogs

A minimalist, git-tracked markdown blog that deploys to GitHub Pages.
Markdown lives in `blogs/`; the static site (Astro) is generated from it.

## Layout

```
blogs/                  content — every *.md is a page, media is mirrored
src/                    site code (everything except tool config)
  pages/                index + [...slug] post pages
  components/           Tree (sidebar), Toc (outline)
  layouts/              Base.astro shell
  lib/                  markdown pipeline, content access layer
  styles/               global.css — all visual design
  scripts/              generate-manifest.mjs (runs pre-build/pre-dev)
  generated/            build artifacts, gitignored
public/assets/          media mirror produced by the generator, gitignored
package.json, astro.config.mjs, tsconfig.json
.github/workflows/deploy.yml
```

## Authoring content

- Add `*.md` files anywhere under `blogs/`. Every file becomes a page at `/<path-without-extension>/`.
- The page title is the first `# ` heading; without one, the filename is humanized (`deep-dive.md` → "Deep dive").
- No front matter required.
- Images/videos referenced with relative paths are copied into the build and rewritten automatically.
- Commit `.md` and media files to publish them. **Uncommitted files render locally as drafts** — the deployed site is built from a clean CI checkout, so only committed files ever reach GitHub Pages.

## Build & test

```
npm install
npm run dev        # dev server at http://localhost:4321
npm run build      # static site into dist/
npm run preview    # serve the built site
```

A post renders at `/<slug>/`, e.g. `http://localhost:4321/my-post/`.

## Deployment

Push to GitHub. The workflow in `.github/workflows/deploy.yml` builds and
publishes on every push to `main` (and can be triggered manually). It handles
both project repos (`user.github.io/name`) and user pages (`user.github.io`).

## Customizing

- Design: `src/styles/global.css` (colors, grid, typography).
- Markdown pipeline: `src/lib/markdown.ts` (plugin order is load-bearing).
