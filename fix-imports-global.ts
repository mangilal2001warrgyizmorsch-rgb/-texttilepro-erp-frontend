import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join(__dirname, "src");

function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

walkDir(DEST_DIR, (filePath) => {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
    let content = fs.readFileSync(filePath, "utf-8");
    
    // Replace .tsx" with " inside import paths
    let newContent = content.replace(/\.tsx"/g, '"');
    newContent = newContent.replace(/\.ts"/g, '"');
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
    }
  }
});

console.log("Global TSX/TS imports fixed.");
