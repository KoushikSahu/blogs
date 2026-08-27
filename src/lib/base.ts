/**
 * Join a site-absolute URL with the configured base path.
 * Base comes from `base` in astro.config.mjs, which GitHub Pages deployments
 * set to "/<repo>" (see SITE_BASE in .github/workflows/deploy.yml).
 */
export function withBase(url: string): string {
  const base = import.meta.env.BASE_URL;
  return (base.endsWith('/') ? base : base + '/') + url.replace(/^\//, '');
}