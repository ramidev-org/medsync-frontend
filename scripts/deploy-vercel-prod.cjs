const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");
const PROJECT_JSON = path.join(ROOT, ".vercel", "project.json");

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
};

const ensure = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const copyDir = (source, target) => {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
};

const readProjectInfo = () => {
  ensure(fs.existsSync(PROJECT_JSON), "Missing .vercel/project.json. Run `vercel link` first.");
  const raw = fs.readFileSync(PROJECT_JSON, "utf8");
  const data = JSON.parse(raw);
  ensure(data.projectName, "Missing projectName in .vercel/project.json.");
  ensure(data.orgId, "Missing orgId in .vercel/project.json.");
  return data;
};

const main = () => {
  const { projectName, orgId } = readProjectInfo();

  console.log("[deploy:prod] Exporting web build...");
  run("npm", ["run", "export:web"], { cwd: ROOT });

  ensure(fs.existsSync(DIST_DIR), "dist directory was not generated.");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mydoctor-vercel-"));
  console.log(`[deploy:prod] Preparing temp deploy dir: ${tempDir}`);
  copyDir(DIST_DIR, tempDir);

  try {
    console.log("[deploy:prod] Linking temp dir to Vercel project...");
    run("vercel", ["link", "--project", projectName, "--scope", orgId, "--yes"], { cwd: tempDir });

    console.log("[deploy:prod] Deploying to production...");
    run("vercel", ["--prod", "--yes"], { cwd: tempDir });
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[deploy:prod] Could not remove temp directory ${tempDir}: ${error.message}`);
    }
  }
};

main();
