function formatDate(date) {
  // Форматируем дату в формате DD.MM.YYYY
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function calculateMonthlyAccruedProfit(
  initialMoney,
  annualRate,
  startDate,
  operationDates
) {
  const dailyRate = annualRate / 100 / 366; // Дневная ставка с учётом високосного года
  const start = new Date(startDate);
  let logs = [];
  let totalProfit = 0;
  let money = initialMoney;

  operationDates.forEach((operationDate, index) => {
    const targetDate = new Date(operationDate);
    const daysInPeriod = Math.round(
      (targetDate - start) / (1000 * 60 * 60 * 24)
    ); // Количество дней в периоде

    const periodProfit = money * dailyRate * daysInPeriod; // Доход за период
    const endingAmount = money + periodProfit; // Итоговая сумма

    logs.push({
      period: `Период ${index + 1}`,
      startDate: formatDate(start),
      endDate: formatDate(targetDate),
      startingAmount: money.toFixed(2),
      periodProfit: periodProfit.toFixed(2),
      endingAmount: endingAmount.toFixed(2)
    });

    totalProfit += periodProfit;
    money = endingAmount; // Обновляем сумму для следующего периода
    start.setTime(targetDate.getTime()); // Обновляем начальную дату
  });

  return { logs, totalProfit: totalProfit.toFixed(2) };
}

// Данные примера
const deposit = {
  money: 50000,
  annualRate: 16.67, // Годовая ставка в процентах
  startDate: "2024-07-23",
  operationDates: ["2024-08-23", "2024-09-23", "2024-10-23", "2024-11-23"]
};

// Расчёт
const result = calculateMonthlyAccruedProfit(
  deposit.money,
  deposit.annualRate,
  deposit.startDate,
  deposit.operationDates
);

// Вывод расчётов
result.logs.forEach((log) => {
  console.log(`\n${log.period}:`);
  console.log(`Сумма на начало периода: ${log.startingAmount}`);
  console.log(`Доход за период: ${log.periodProfit}`);
  console.log(`Сумма на конец периода: ${log.endingAmount}`);
});

// Итоговая строка
console.log("\nИТОГО:");
console.log(`Суммарный профит: ${result.totalProfit}`);
