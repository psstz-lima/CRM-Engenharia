const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'out');
const DEST = path.join(__dirname, '..', 'out-relative');

function isTextFile(file) {
  const textExt = ['.html', '.js', '.css', '.json', '.txt', '.xml', '.svg', '.map'];
  return textExt.includes(path.extname(file).toLowerCase());
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function transformContent(content) {
  // Replace absolute root paths like "/_next/..." or "/images/..." or "/favicon.ico"
  // but do NOT touch protocol-relative or absolute URLs (http://, https://, //)
  // Replace occurrences that follow a quote or ( or whitespace.
  return content.replace(/(["'\(])\/(?!\/|http|https|#)/g, '$1./');
}

function copyRecursive(srcDir, destDir) {
  ensureDir(destDir);
  const items = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const it of items) {
    const srcPath = path.join(srcDir, it.name);
    const destPath = path.join(destDir, it.name);
    if (it.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (it.isFile()) {
      if (isTextFile(it.name)) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = transformContent(content);
        fs.writeFileSync(destPath, content, 'utf8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// remove dest if exists
if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
}

if (!fs.existsSync(SRC)) {
  console.error('Source out/ folder not found. Run build/export first.');
  process.exit(1);
}

console.log('Copying and rewriting paths from', SRC, 'to', DEST);
copyRecursive(SRC, DEST);
console.log('Done. Open', path.join(DEST, 'index.html'), 'with file://');
