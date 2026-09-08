import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { routeSeoConfig } from "./route-seo-config.mjs";

const origin = "https://www.rikkismobile.com";
const routes = ["", ...Object.keys(routeSeoConfig), "connect"];
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const htmlFor = (route) => readFile(path.join("dist", route, "index.html"), "utf8");
const sitemap = await readFile("dist/sitemap.xml", "utf8");
const robots = await readFile("dist/robots.txt", "utf8");
check(!/Disallow:\s*\/(tip|order|bartender)/.test(robots), "noindex pages must be crawlable");
for (const route of routes) {
  const html = await htmlFor(route);
  const url = `${origin}/${route}`;
  check(html.includes(`rel="canonical" href="${url}"`), `${route}: canonical`);
  check((html.match(/rel="canonical"/g) ?? []).length === 1, `${route}: one canonical`);
  check((html.match(/<h1(?:\s|>)/g) ?? []).length === 1, `${route}: one H1`);
  check(html.includes('data-prerendered="true"'), `${route}: rendered body`);
  check(!html.includes('content="noindex'), `${route}: indexable`);
  check(sitemap.includes(`<loc>${url}</loc>`), `${route}: sitemap membership`);
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  check(schemas.some((s) => s["@type"] === "LocalBusiness"), `${route}: business schema`);
  if (route in routeSeoConfig) check(schemas.some((s) => s["@type"] === "BreadcrumbList"), `${route}: initial route schema`);
  if (route.startsWith("blog/")) check(schemas.some((s) => s["@type"] === "BlogPosting"), `${route}: article schema`);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
    const target = match[1];
    if (target.startsWith("//")) continue;
    const file = path.join("dist", target);
    try { await access(path.extname(target) ? file : path.join(file, "index.html")); }
    catch { throw new Error(`${route}: missing local target ${target}`); }
    checks++;
  }
  console.log(`PASS ${url}: HTML content, metadata, schema, local links/assets`);
}
for (const route of ["tip", "order", "bartender"]) {
  check((await htmlFor(route)).includes('content="noindex,follow"'), `${route}: noindex`);
  check(!sitemap.includes(`<loc>${origin}/${route}</loc>`), `${route}: excluded from sitemap`);
}
check((await readFile("dist/404.html", "utf8")).includes('content="noindex,follow"'), "404 noindex");
check(!JSON.parse(await readFile("vercel.json", "utf8")).rewrites?.some((r) => r.source === "/(.*)"), "no catch-all soft 404 rewrite");
const home = await htmlFor("");
check(home.includes("aol.com/articles/van-liquor-license"), "visible editorial reference");
check(home.includes("Regional Chamber listing"), "visible directory reference");
check(!home.includes("’78 Club Wagon"), "correct vehicle year in homepage header");
console.log(`PASS: ${checks} checks. This is a build audit, not a production or search-ranking measurement.`);
