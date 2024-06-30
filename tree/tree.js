import fs from "fs";
import path from "path";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

// Функция для получения символов ветвления
function getBranchSymbols(isLast) {
  return isLast ? "└─" : "├─";
}

// Функция для определения цвета файла по его расширению
function getColorByExtension(fileName) {
  if (fileName.endsWith(".vue")) return chalk.green;
  if (fileName.endsWith(".js")) return chalk.yellow;
  if (fileName.endsWith(".ts")) return chalk.cyan;
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
    let items = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((dirent) => !dirent.name.startsWith(".")) // Исключаем скрытые файлы и папки
        .map((dirent) => ({
          name: dirent.name,
          path: path.join(dir, dirent.name),
          isDirectory: dirent.isDirectory(),
        }));

    // Рекурсивно исключаем вложенные 'node_modules'
    items = items.filter((item) => !item.name.startsWith("node_modules"));

    return items.sort((a, b) => sortItems(a, b));
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
  const color = contents.length > 0 ? chalk.blue : chalk.red; // Исправлено условие
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
const directory = process.env.DIRECTORY;
if (directory) {
  listFiles(directory);
} else {
  console.error(chalk.red("Переменная окружения DIRECTORY не определена."));
}