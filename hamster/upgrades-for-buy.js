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
        return;
      }

      const upgrades = jsonData.upgradesForBuy;

      // Находим самые акупаемые апгрейды
      const topUpgrades = upgrades
        .filter((upgrade) => upgrade.isAvailable) // Фильтруем доступные для покупки
        .map((upgrade) => ({
          ...upgrade,
          paybackPeriod: upgrade.price / upgrade.profitPerHourDelta, // Вычисляем период окупаемости
        }))
        .sort((a, b) => a.paybackPeriod - b.paybackPeriod); // Сортируем по периоду окупаемости

      // Выводим информацию о самых акупаемых апгрейдах
      console.log("Топ самых акупаемых апгрейдов:");
      topUpgrades.forEach((upgrade) => {
        console.log(
          `- ${upgrade.section}:` +
            `- ${upgrade.name}:` +
            `окупаемость ${upgrade.paybackPeriod.toFixed(2)} ч.`
        );
      });

      // Добавьте код для сохранения данных в файл, если необходимо
    } catch (error) {
      console.error("Ошибка парсинга JSON:", error);
    }
  });
});

req.on("error", (error) => {
  console.error("Request error:", error);
});

req.end();
