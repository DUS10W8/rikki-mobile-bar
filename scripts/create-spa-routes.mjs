import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPrivacyPageHtml, buildTermsPageHtml } from "./compliance-pages.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const sourceIndex = path.join(distDir, "index.html");
/** SPA fallbacks that need the full React bundle (same as index.html). */
const spaRoutes = ["tip", "order", "bartender"];

for (const route of spaRoutes) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");

  await mkdir(routeDir, { recursive: true });
  await copyFile(sourceIndex, routeIndex);

  console.log(`Created static SPA fallback: dist/${route}/index.html`);
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
