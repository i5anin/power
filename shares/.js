// Создайте клиент API с вашим ключом
const client = new twelvedata.Client({ apikey: "YOUR_API_KEY" });

// Получите данные по FXDE за последний месяц с интервалом в один день
client
  .timeSeries({
    symbol: "FXDE",
    interval: "1day",
    outputsize: 30
  })
  .then((data) => {
    // Выведите данные в консоль
    console.log(data);
  })
  .catch((error) => {
    // Обработайте ошибку
    console.error(error);
  });

// Импортируйте модуль YH Finance
const yh = require("yh-finance");

// Получите данные по TMOS за последний год с интервалом в одну неделю
yh.getHistoricalPrices("TMOS", "1wk", "1y")
  .then((data) => {
    // Выведите данные в консоль
    console.log(data);
  })
  .catch((error) => {
    // Обработайте ошибку
    console.error(error);
  });

// Импортируйте модуль Yahoo Finance
const yahooFinance = require("yahoo-finance");

// Получите данные по TSPX за последний месяц с интервалом в один день
yahooFinance
  .historical({
    symbol: "TSPX",
    from: "2023-06-01",
    to: "2023-07-01",
    period: "d"
  })
  .then((data) => {
    // Выведите данные в консоль
    console.log(data);
  })
  .catch((error) => {
    // Обработайте ошибку
    console.error(error);
  });

// Импортируйте модуль Alpha Vantage
const alpha = require("alphavantage")({ key: "YOUR_API_KEY" });

// Получите данные по TECH за последний год с интервалом в один день
alpha.data
  .daily("TECH", "full")
  .then((data) => {
    // Выведите данные в консоль
    console.log(data);
  })
  .catch((error) => {
    // Обработайте ошибку
    console.error(error);
  });
