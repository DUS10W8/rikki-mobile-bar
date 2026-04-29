import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const sourceIndex = path.join(distDir, "index.html");
const tipDir = path.join(distDir, "tip");
const tipIndex = path.join(tipDir, "index.html");

await mkdir(tipDir, { recursive: true });
await copyFile(sourceIndex, tipIndex);

console.log("Created static SPA fallback: dist/tip/index.html");
