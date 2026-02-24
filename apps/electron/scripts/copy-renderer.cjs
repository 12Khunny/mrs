const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve(__dirname, "../../client/dist");
const targetDir = path.resolve(__dirname, "../renderer");

if (!fs.existsSync(sourceDir)) {
  console.error(`Renderer build not found: ${sourceDir}`);
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied renderer build: ${sourceDir} -> ${targetDir}`);
