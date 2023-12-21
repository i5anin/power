import fs from "fs";
import path from "path";
import chalk from "chalk";

function listFiles(dir, prefix = "") {
  let items;
  try {
    items = fs.readdirSync(dir).map((name) => ({
      name,
      path: path.join(dir, name),
      isDirectory: fs.statSync(path.join(dir, name)).isDirectory()
    }));
  } catch (err) {
    console.error(chalk.red(`Error reading directory ${dir}: ${err.message}`));
    return;
  }

  // Сортировка: сначала папки, затем файлы
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    try {
      if (item.isDirectory) {
        console.log(chalk.blue(prefix + (isLast ? "└─" : "├─") + item.name));
        listFiles(item.path, prefix + (isLast ? "    " : "|   "));
      } else {
        let color = chalk.white;
        if (item.name.endsWith(".vue")) color = chalk.green;
        else if (item.name.endsWith(".js")) color = chalk.yellow;

        console.log(color(prefix + (isLast ? "└─" : "├─") + item.name));
      }
    } catch (err) {
      console.error(
        chalk.red(`Error reading file ${item.path}: ${err.message}`)
      );
    }
  });
}

const directory = "S:/development/soft.vue.pf-forum/src"; // Используйте свой путь
listFiles(directory);
