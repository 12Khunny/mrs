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
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (name === "node_modules" && entry.startsWith(".pnpm")) {
        copy(path.join(src, entry), path.join(dst, entry));
        continue;
      }
      if (entry === ".git") continue;
      copy(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }
  fs.copyFileSync(src, dst);
};

copy(sourceDir, targetDir);
copy(path.join(sourceDir, "node_modules"), path.join(targetDir, "node_modules"));
console.log(`Copied server source: ${sourceDir} -> ${targetDir}`);
