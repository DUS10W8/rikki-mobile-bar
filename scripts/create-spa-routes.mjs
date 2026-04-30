import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const sourceIndex = path.join(distDir, "index.html");
const spaRoutes = ["tip", "order", "privacy", "terms", "bartender"];

for (const route of spaRoutes) {
  const routeDir = path.join(distDir, route);
  const routeIndex = path.join(routeDir, "index.html");

  await mkdir(routeDir, { recursive: true });
  await copyFile(sourceIndex, routeIndex);

  console.log(`Created static SPA fallback: dist/${route}/index.html`);
}
