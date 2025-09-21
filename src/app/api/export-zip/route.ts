import JSZip from "jszip";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Folders to skip entirely
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".turbo",
  "dist",
  "build",
  ".cache",
  ".idea",
  ".vscode",
]);

// Files to skip (exact names or by prefix)
const EXCLUDED_FILES = new Set([
  ".DS_Store",
  "Thumbs.db",
]);

function shouldExclude(filePath: string, name: string, isDir: boolean) {
  if (isDir && EXCLUDED_DIRS.has(name)) return true;
  if (EXCLUDED_FILES.has(name)) return true;
  // Exclude any env files
  if (name.startsWith(".env")) return true;
  // Exclude lockfiles if desired; comment out if you want to include
  // if (name === "package-lock.json" || name === "bun.lock" || name === "pnpm-lock.yaml" || name === "yarn.lock") return true;
  return false;
}

async function addFolderToZip(zip: JSZip, folderPath: string, zipFolder: JSZip) {
  const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (shouldExclude(entryPath, entry.name, entry.isDirectory())) continue;

    if (entry.isDirectory()) {
      const sub = zipFolder.folder(entry.name);
      if (!sub) continue;
      await addFolderToZip(zip, entryPath, sub);
    } else if (entry.isFile()) {
      const data = await fs.promises.readFile(entryPath);
      zipFolder.file(entry.name, data);
    }
  }
}

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const zip = new JSZip();

    // Include selected top-level items
    const topLevel = await fs.promises.readdir(projectRoot, { withFileTypes: true });
    for (const entry of topLevel) {
      const name = entry.name;
      const abs = path.join(projectRoot, name);
      if (shouldExclude(abs, name, entry.isDirectory())) continue;

      if (entry.isDirectory()) {
        // Only include project-relevant dirs
        if (["src", "public", "scripts"].includes(name)) {
          const dir = zip.folder(name);
          if (!dir) continue;
          await addFolderToZip(zip, abs, dir);
        }
      } else if (entry.isFile()) {
        // Include common project files
        if (/^(package.json|package-lock.json|bun.lock|tsconfig.json|next.config.(js|mjs|ts)|postcss.config.(js|mjs)|eslint.config.(js|mjs|ts)|tailwind.config.(js|ts)|README.md|components.json|.prettierrc|.editorconfig|next-env.d.ts)$/u.test(name)) {
          const data = await fs.promises.readFile(abs);
          zip.file(name, data);
        }
      }
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=orchids-app.zip` ,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("ZIP export failed:", err);
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 });
  }
}