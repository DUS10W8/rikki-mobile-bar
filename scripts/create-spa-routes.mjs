import { copyFile, mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";

import { buildPrivacyPageHtml, buildTermsPageHtml } from "./compliance-pages.mjs";
import { routeSeoConfig, buildCanonical } from "./route-seo-config.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const sourceIndex = path.join(distDir, "index.html");
const sourceHtml = await readFile(sourceIndex, "utf8");

/** SPA fallbacks that need the full React bundle but keep the homepage's <head> as-is. */
const spaRoutes = ["tip", "order", "bartender"];
/** Operational/internal tools: keep crawlable for direct links, but don't compete for search rankings. */
const noindexRoutes = new Set(["tip", "order", "bartender"]);

function withNoindex(html) {
  if (html.includes('name="robots"')) {
    return html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex,follow" />');
  }
  return html.replace("</head>", '  <meta name="robots" content="noindex,follow" />\n</head>');
}

for (const route of spaRoutes) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");

  await mkdir(routeDir, { recursive: true });
  if (noindexRoutes.has(route)) {
    await writeFile(routeIndex, withNoindex(sourceHtml), "utf8");
  } else {
    await copyFile(sourceIndex, routeIndex);
  }

  console.log(`Created static SPA fallback: dist/${route}/index.html`);
}

/**
 * SEO landing + blog routes: same full JS bundle as the homepage, but with the
 * <title>/description/canonical/OG tags swapped for the route so crawlers and
 * link-preview bots see accurate metadata before any JS runs. The React page
 * component (useDocumentHead) re-applies the same values on hydration.
 */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderSeoRouteHtml(route, { title, description }) {
  const canonical = buildCanonical(route);
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  let html = sourceHtml;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${safeTitle}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/s, `<meta name="description" content="${safeDesc}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/s, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/s, `<meta property="og:description" content="${safeDesc}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/s, `<meta name="twitter:title" content="${safeTitle}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/s, `<meta name="twitter:description" content="${safeDesc}" />`);

  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link rel="canonical" href=".*?" \/>/s, `<link rel="canonical" href="${canonical}" />`);
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${canonical}" />\n</head>`);
  }
  if (html.includes('property="og:url"')) {
    html = html.replace(/<meta property="og:url" content=".*?" \/>/s, `<meta property="og:url" content="${canonical}" />`);
  } else {
    html = html.replace("</head>", `  <meta property="og:url" content="${canonical}" />\n</head>`);
  }

  return html;
}

for (const [route, meta] of Object.entries(routeSeoConfig)) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");

  await mkdir(routeDir, { recursive: true });
  await writeFile(routeIndex, renderSeoRouteHtml(route, meta), "utf8");

  console.log(`Created static SEO route: dist/${route}/index.html`);
}

/** Twilio / carrier-friendly static HTML: full legal text in document source, no JS. */
const compliancePages = [
  ["privacy", buildPrivacyPageHtml()],
  ["terms", buildTermsPageHtml()],
];

for (const [route, html] of compliancePages) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");

  await mkdir(routeDir, { recursive: true });
  await writeFile(routeIndex, html, "utf8");

  console.log(`Created static compliance page: dist/${route}/index.html`);
}

// Render the actual React components at build time; no second copy of page content.
// The SEO collector captures the same metadata/schema used by the browser hook.
// Compile server JSX with the same production transform as the browser bundle.
// Development transforms can preserve different whitespace and break hydration.
const ssrDir = path.join(rootDir, "node_modules", ".tmp", "prerender");
await build({ build: { ssr: "src/entry-server.tsx", outDir: ssrDir, emptyOutDir: false, copyPublicDir: false }, logLevel: "warn" });
{
  const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
  for (const route of ["", ...Object.keys(routeSeoConfig), "connect", "404"]) {
    const { body, meta } = render(route);
    let html = meta ? renderSeoRouteHtml(route, meta) : sourceHtml;
    if (meta?.noindex) html = withNoindex(html);
    if (meta?.schema) {
      const jsonLd = meta.schema.map((schema) => `<script type="application/ld+json" data-seo-schema="1">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`).join("\n");
      html = html.replace("</head>", `${jsonLd}\n</head>`);
    }
    if (meta?.schema?.some((schema) => schema["@type"] === "BlogPosting")) {
      html = html.replace('property="og:type" content="website"', 'property="og:type" content="article"');
    }
    html = html.replace('<div id="root"></div>', () => `<div id="root" data-prerendered="true">${body}</div>`);
    const output = route === "404" ? path.join(distDir, "404.html") : path.join(distDir, route, "index.html");
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, html, "utf8");
    console.log(`Prerendered content and schema: ${route || "/"}`);
  }
}
