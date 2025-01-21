function formatDate(date) {
  // Форматируем дату в формате DD.MM.YYYY
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function calculateDailyAccruedProfitDetailed(
  money,
  annualRate,
  startDate,
  operationDates
) {
  const dailyRate = annualRate / 100 / 365; // Дневная ставка
  const start = new Date(startDate);
  let logs = [];
  let detailedLogs = [];
  let current = new Date(start); // Текущая дата для начисления
  let totalProfit = 0;

  operationDates.forEach((operationDate, index) => {
    const targetDate = new Date(operationDate); // Конечная дата текущего периода
    let monthlyProfit = 0;
    let startingAmount = money; // Сохраняем сумму на начало месяца
    let dailyLogs = []; // Подробные логи для текущего месяца

    // Рассчитываем доход за каждый день до целевой даты
    while (current < targetDate) {
      const dailyProfit = money * dailyRate; // Начисляем проценты за день
      monthlyProfit += dailyProfit; // Суммируем в месячный доход
      money += dailyProfit; // Увеличиваем базовую сумму

      // Логируем каждый день для текущего месяца
      dailyLogs.push({
        date: formatDate(current),
        dailyProfit: dailyProfit.toFixed(2),
        totalAmount: money.toFixed(2)
      });

      current.setDate(current.getDate() + 1); // Переход к следующему дню
    }

    // Логируем результат для текущего периода
    logs.push({
      date: formatDate(targetDate),
      monthlyProfit: monthlyProfit.toFixed(2),
      startingAmount: startingAmount.toFixed(2),
      totalAmount: money.toFixed(2),
      dailyLogs
    });

    totalProfit += monthlyProfit; // Суммируем в общий профит
  });

  return { logs, totalProfit: totalProfit.toFixed(2) };
}

// Данные примера
const deposit = {
  money: 50000,
  annualRate: 16.67, // Годовая ставка в процентах
  startDate: "2024-07-23",
  operationDates: ["2024-08-23", "2024-09-23", "2024-10-23", "2024-11-23"] // Даты операций
};

// Расчёт
const result = calculateDailyAccruedProfitDetailed(
  deposit.money,
  deposit.annualRate,
  deposit.startDate,
  deposit.operationDates
);

// Вывод расчетов, разделенных на периоды
result.logs.forEach((log, index) => {
  console.log(`\nПериод ${index + 1}: ${log.date}`);
  console.log(`Сумма на начало месяца: ${log.startingAmount}`);
  console.log(`Доход за месяц: ${log.monthlyProfit}`);
  console.log(`Сумма на конец месяца: ${log.totalAmount}`);
  console.log("Подробный расчет по дням:");
  log.dailyLogs.forEach((dailyLog) => {
    console.log(
      `  Дата: ${dailyLog.date}, Доход за день: ${dailyLog.dailyProfit}, Сумма на конец дня: ${dailyLog.totalAmount}`
    );
  });
});

// Итоговая строка
console.log("\nИТОГО:");
console.log(`Суммарный профит: ${result.totalProfit}`);
