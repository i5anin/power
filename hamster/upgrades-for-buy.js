import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import fs from "fs";
import { headers } from "./config.js";

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/upgrades-for-buy",
  method: "POST",
  headers: headers,
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  let responseData = [];

  res.on("data", (chunk) => {
    responseData.push(chunk);
  });

  res.on("end", () => {
    try {
      let buffer = Buffer.concat(responseData);
      const encoding = res.headers["content-encoding"];

      if (encoding === "gzip") {
        buffer = gunzipSync(buffer);
      } else if (encoding === "deflate") {
        buffer = inflateSync(buffer);
      } else if (encoding === "br") {
        buffer = brotliDecompressSync(buffer);
      }

      const jsonData = JSON.parse(buffer.toString());

      if (res.statusCode === 400) {
        console.error("Ошибка:", jsonData.message);
        return; // Прекращаем выполнение, если код ответа 400
      }

      // Получаем текущую дату и время в нужном формате
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${(
        "0" +
        (currentDate.getMonth() + 1)
      ).slice(-2)}-${("0" + currentDate.getDate()).slice(
        -2
      )} ${currentDate.getHours()} ${currentDate.getMinutes()} ${currentDate.getSeconds()}`;

      // Создаем имя файла с датой
      const fileName = `json/upgrades-for-buy_${formattedDate}.json`;

      // Записываем данные в файл
      fs.writeFile(fileName, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error("Ошибка записи в файл:", err);
        } else {
          console.log(`Данные успешно записаны в файл ${fileName}`);
        }
      });

      // Фильтруем апгрейды с cooldownSeconds = 0
      const availableUpgrades = jsonData.upgradesForBuy.filter(
        (upgrade) => upgrade.cooldownSeconds === 0 && !upgrade.isExpired
      );

      // Создаем массив объектов с информацией об апгрейдах и периоде окупаемости
      const upgradesWithPayback = availableUpgrades.map((upgrade) => ({
        ...upgrade,
        paybackPeriod: upgrade.profitPerHour
          ? upgrade.price / upgrade.profitPerHour
          : Infinity, // Если прирост прибыли 0, устанавливаем бесконечный период окупаемости
      }));

      // Сортируем апгрейды по периоду окупаемости
      const sortedUpgrades = upgradesWithPayback.sort(
        (a, b) => a.paybackPeriod - b.paybackPeriod
      );

      // Выводим информацию о  всех апгрейдах с нумерацией
      console.log("Доступные для покупки апгрейды:");
      sortedUpgrades.forEach((upgrade, index) => {
        console.log(
          `${index + 1}. ${upgrade.section}: ${upgrade.name} ${
            upgrade.price
          } - окупаемость: ${
            upgrade.paybackPeriod !== Infinity
              ? upgrade.paybackPeriod.toFixed(2) + " ч."
              : "бесконечность"
          } ${!upgrade.isAvailable ? "(недоступно)" : ""}`
        );
      });
    } catch (error) {
      console.error("Ошибка парсинга JSON:", error);
    }
  });
});

req.on("error", (error) => {
  console.error("Request error:", error);
});

req.end();
