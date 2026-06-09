const fs = require("fs");
const path = require("path");

const nodeModulesRoot = path.join(process.cwd(), "node_modules");
const brokenLine = "import tslib from '../tslib.js';";
const fixedLine = "import * as tslib from '../tslib.js';";

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(path.join("tslib", "modules", "index.js"))) {
      results.push(fullPath);
    }
  }

  return results;
}

try {
  if (!fs.existsSync(nodeModulesRoot)) {
    process.exit(0);
  }

  const targets = walk(nodeModulesRoot);
  let patchedCount = 0;

  for (const targetFile of targets) {
    const source = fs.readFileSync(targetFile, "utf8");
    if (!source.includes(brokenLine)) continue;

    fs.writeFileSync(targetFile, source.replace(brokenLine, fixedLine));
    patchedCount += 1;
  }

  if (patchedCount > 0) {
    console.log(`[patch-zrender-tslib] Patched ${patchedCount} nested tslib import(s) for Metro compatibility.`);
  }
} catch (error) {
  console.warn("[patch-zrender-tslib] Patch skipped:", error instanceof Error ? error.message : error);
}
