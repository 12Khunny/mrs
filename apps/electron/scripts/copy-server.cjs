const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve(__dirname, "../../server");
const targetDir = path.resolve(__dirname, "../server-dist");

if (!fs.existsSync(sourceDir)) {
  console.error(`Server source not found: ${sourceDir}`);
  process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

const copy = (src, dst) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const name = path.basename(src);
    if (name === "node_modules" || name === ".git") return;
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copy(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }
  fs.copyFileSync(src, dst);
};

copy(sourceDir, targetDir);
console.log(`Copied server source: ${sourceDir} -> ${targetDir}`);
