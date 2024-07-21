import Table from "cli-table";

// Создание новой таблицы
const table = new Table({
  head: ["Имя", "Возраст", "Город"],
  colWidths: [15, 10, 15], // Ширина столбцов
});

// Добавление данных в таблицу
table.push(
  ["John", 28, "New York"],
  ["Alice", 23, "London"],
  ["Mike", 32, "Berlin"]
);

// Вывод таблицы в консоль
console.log(table.toString());
