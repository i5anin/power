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

      // Создаем массив объектов с информацией об апгрейдах и периоде окупаемости
      const upgradesWithPayback = upgrades.map((upgrade) => ({
        ...upgrade,
        paybackPeriod: upgrade.profitPerHourDelta
          ? upgrade.price / upgrade.profitPerHourDelta
          : Infinity, // Если прирост прибыли 0, устанавливаем бесконечный период окупаемости
      }));

      // Сортируем апгрейды по периоду окупаемости
      const sortedUpgrades = upgradesWithPayback.sort(
        (a, b) => a.paybackPeriod - b.paybackPeriod
      );

      // Выводим информацию о  всех апгрейдах с нумерацией
      console.log("Все акупаемые апгрейды:");
      sortedUpgrades.forEach((upgrade, index) => {
        console.log(
          `${index + 1}. ${upgrade.section}: ${upgrade.name} - окупаемость: ${
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
