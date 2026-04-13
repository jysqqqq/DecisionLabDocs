import { mkdir, readdir, rm, copyFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const docsDir = path.join(rootDir, "docs");
const outputDir = path.join(docsDir, "public", "__raw");

const skippedDirs = new Set([".vitepress", "public", "node_modules"]);
const copiedExtensions = new Set([
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif"
]);

async function walk(currentDir) {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skippedDirs.has(entry.name)) continue;
      await walk(path.join(currentDir, entry.name));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!copiedExtensions.has(ext)) continue;

    const sourcePath = path.join(currentDir, entry.name);
    const relativePath = path.relative(docsDir, sourcePath);
    const destinationPath = path.join(outputDir, relativePath);

    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFile(sourcePath, destinationPath);
  }
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await walk(docsDir);

console.log(`Prepared raw docs in ${path.relative(rootDir, outputDir)}`);
