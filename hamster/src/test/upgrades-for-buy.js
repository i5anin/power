import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import fs from "fs";
import { headers } from "../config.js";

// Настройки запроса к API
const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/upgrades-for-buy",
  method: "POST",
  headers: headers
};

// Создание запроса
const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  let responseData = [];

  // Обработка поступления данных
  res.on("data", (chunk) => {
    responseData.push(chunk);
  });

  // Обработка окончания получения данных
  res.on("end", () => {
    try {
      // Объединение фрагментов данных в один буфер
      let buffer = Buffer.concat(responseData);
      const encoding = res.headers["content-encoding"];

      // Декодирование данных в зависимости от заголовка Content-Encoding
      if (encoding === "gzip") {
        buffer = gunzipSync(buffer);
      } else if (encoding === "deflate") {
        buffer = inflateSync(buffer);
      } else if (encoding === "br") {
        buffer = brotliDecompressSync(buffer);
      }

      // Преобразование данных из JSON в объект JavaScript
      const jsonData = JSON.parse(buffer.toString());

      // ... остальной код

      // Фильтрация апгрейдов: доступные и не просроченные
      const availableUpgrades = jsonData.upgradesForBuy.filter(
        (upgrade) =>
          (upgrade.cooldownSeconds === 0 ||
            upgrade.cooldownSeconds === undefined) &&
          !upgrade.isExpired &&
          upgrade.isAvailable // Добавьте проверку isAvailable здесь
      );

      // Создание массива объектов с информацией об апгрейдах и расчетом периода окупаемости
      const upgradesWithPayback = availableUpgrades.map((upgrade) => ({
        ...upgrade,
        paybackPeriod: upgrade.profitPerHour
          ? upgrade.price / upgrade.profitPerHour
          : Infinity // Если profitPerHour равен 0, устанавливаем бесконечный период окупаемости
      }));

      // Сортировка апгрейдов по возрастанию периода окупаемости
      const sortedUpgrades = upgradesWithPayback.sort(
        (a, b) => a.paybackPeriod - b.paybackPeriod
      );

      // Вывод информации о доступных для покупки апгрейдах
      console.log("Доступные для покупки апгрейды:");
      sortedUpgrades.forEach((upgrade, index) => {
        console.log(
          `${index + 1}. ${upgrade.section}: ${upgrade.name} ${
            upgrade.price
          } - окупаемость: ${
            upgrade.paybackPeriod !== Infinity
              ? upgrade.paybackPeriod.toFixed(2) + " ч."
              : "бесконечность"
          }`
        );
      });
    } catch (error) {
      console.error("Ошибка парсинга JSON:", error);
    }
  });
});

// Обработка ошибок запроса
req.on("error", (error) => {
  console.error("Request error:", error);
});

// Отправка запроса
req.end();
