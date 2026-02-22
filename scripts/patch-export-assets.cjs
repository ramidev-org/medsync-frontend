const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(process.cwd(), "dist");
const SOURCE_ROOT = path.join(DIST_DIR, "assets", "node_modules");
const TARGET_ROOT = path.join(DIST_DIR, "assets", "vendor");
const SOURCE_TOKEN = "/assets/node_modules/";
const TARGET_TOKEN = "/assets/vendor/";

const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map"]);

const exists = (value) => {
  try {
    fs.accessSync(value);
    return true;
  } catch {
    return false;
  }
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const copyDirectory = (sourceDir, targetDir) => {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
};

const rewriteAssetPaths = (rootDir) => {
  const stats = { filesScanned: 0, filesRewritten: 0, replacements: 0 };

  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) {
        continue;
      }

      stats.filesScanned += 1;

      const content = fs.readFileSync(fullPath, "utf8");
      const matches = content.split(SOURCE_TOKEN).length - 1;
      if (matches <= 0) {
        continue;
      }

      const updated = content.split(SOURCE_TOKEN).join(TARGET_TOKEN);
      fs.writeFileSync(fullPath, updated);

      stats.filesRewritten += 1;
      stats.replacements += matches;
    }
  };

  visit(rootDir);
  return stats;
};

const main = () => {
  if (!exists(DIST_DIR)) {
    console.log("[patch-export-assets] dist directory not found, skipping.");
    return;
  }

  if (!exists(SOURCE_ROOT)) {
    console.log("[patch-export-assets] dist/assets/node_modules not found, skipping.");
    return;
  }

  copyDirectory(SOURCE_ROOT, TARGET_ROOT);

  const stats = rewriteAssetPaths(DIST_DIR);

  fs.rmSync(SOURCE_ROOT, { recursive: true, force: true });

  console.log(
    `[patch-export-assets] copied to ${path.relative(DIST_DIR, TARGET_ROOT)}, ` +
      `rewrote ${stats.replacements} references in ${stats.filesRewritten}/${stats.filesScanned} text files.`
  );
};

main();
