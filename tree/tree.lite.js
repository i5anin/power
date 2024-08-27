import fs from "fs";
import path from "path";

const IGNORED_DIRECTORIES = [".idea", "node_modules", "dist", "doc"];

function tree(dirPath, indent = "") {
  const items = fs.readdirSync(dirPath);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Пропустить игнорируемые директории
    if (IGNORED_DIRECTORIES.includes(item)) {
      continue;
    }

    const itemPath = path.join(dirPath, item);
    const isLast = i === items.length - 1;

    console.log(`${indent}${isLast ? "└─" : "├─"} ${item}`);

    if (fs.statSync(itemPath).isDirectory()) {
      tree(itemPath, `${indent}${isLast ? "  " : "|  "}`);
    }
  }
}

// Use a more robust way to get the directory path:
const directory =
  process.env.DIRECTORY || "D:\\GitHub\\pf-soft.vue\\client\\src";
tree(directory);
