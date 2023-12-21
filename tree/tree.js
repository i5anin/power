import fs from "fs";
import path from "path";
import chalk from "chalk";

// Функция для получения символов ветвления
function getBranchSymbols(isLast) {
  return isLast ? "└─" : "├─";
}

// Функция для определения цвета файла по его расширению
function getColorByExtension(fileName) {
  if (fileName.endsWith(".vue")) return chalk.green;
  if (fileName.endsWith(".js")) return chalk.yellow;
  return chalk.white;
}

// Функция для вывода содержимого директории
function listFiles(dir, prefix = "") {
  let items = readDirectory(dir);
  if (!items) return;

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const branchSymbol = getBranchSymbols(isLast);

    if (item.isDirectory) {
      handleDirectory(item, prefix, branchSymbol, isLast);
    } else {
      handleFile(item, prefix, branchSymbol);
    }
  });
}

// Функция для чтения содержимого директории
function readDirectory(dir) {
  try {
    return fs
      .readdirSync(dir)
      .map((name) => ({
        name,
        path: path.join(dir, name),
        isDirectory: fs.statSync(path.join(dir, name)).isDirectory()
      }))
      .sort((a, b) => sortItems(a, b));
  } catch (err) {
    console.error(chalk.red(`Error reading directory ${dir}: ${err.message}`));
    return null;
  }
}

// Функция для сортировки элементов (сначала папки, затем файлы)
function sortItems(a, b) {
  if (a.isDirectory && !b.isDirectory) return -1;
  if (!a.isDirectory && b.isDirectory) return 1;
  return a.name.localeCompare(b.name);
}

// Функция для обработки директории
function handleDirectory(item, prefix, branchSymbol, isLast) {
  const contents = fs.readdirSync(item.path);
  const color = contents.length === 0 ? chalk.red : chalk.blue;
  console.log(color(prefix + branchSymbol + item.name));
  if (contents.length > 0) {
    listFiles(item.path, prefix + (isLast ? "    " : "|   "));
  }
}

// Функция для обработки файла
function handleFile(item, prefix, branchSymbol) {
  const color = getColorByExtension(item.name);
  console.log(color(prefix + branchSymbol + item.name));
}

// Главная функция
const directory = "S:/development/soft.vue.pf-forum/src"; // Используйте свой путь
listFiles(directory);
