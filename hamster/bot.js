import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import fs from "fs";
import { headers } from "./config.js";

function getUpgradesForBuy() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.hamsterkombatgame.io",
      port: 443,
      path: "/clicker/upgrades-for-buy",
      method: "POST",
      headers: headers,
    };

    const req = https.request(options, (res) => {
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
            reject(new Error(jsonData.message));
            return;
          }

          resolve(jsonData);
        } catch (error) {
          console.error("Ошибка парсинга JSON:", error);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    req.end();
  });
}

function buyUpgrade(upgradeId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      upgradeId: upgradeId,
      timestamp: Math.floor(Date.now() / 1000),
    });

    const options = {
      hostname: "api.hamsterkombatgame.io",
      port: 443,
      path: "/clicker/buy-upgrade",
      method: "POST",
      headers: headers,
    };

    const req = https.request(options, (res) => {
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

          // console.log("Полный ответ сервера:", {
          //   statusCode: res.statusCode,
          // });

          if (res.statusCode === 400) {
            console.error("Ошибка покупки:", jsonData.message);
            reject(new Error(jsonData.message));
            return;
          }

          resolve(jsonData);
        } catch (error) {
          console.error("Ошибка парсинга JSON:", error);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  while (true) {
    try {
      const data = await getUpgradesForBuy();

      const availableUpgrades = data.upgradesForBuy
        .filter(
          (upgrade) =>
            upgrade.cooldownSeconds === 0 &&
            upgrade.isAvailable && // <-- Добавлено условие isAvailable
            !upgrade.isExpired // <-- Условие !isExpired
        )
        .map((upgrade) => ({
          ...upgrade,
          paybackPeriod: upgrade.profitPerHour
            ? upgrade.price / upgrade.profitPerHour
            : Infinity,
        }))
        .sort((a, b) => a.paybackPeriod - b.paybackPeriod);

      if (availableUpgrades.length > 0) {
        const bestUpgrade = availableUpgrades[0];
        console.log(
          `Покупаю: ${bestUpgrade.section}: ${bestUpgrade.name} ${
            bestUpgrade.price
          } - окупаемость: ${
            bestUpgrade.paybackPeriod !== Infinity
              ? bestUpgrade.paybackPeriod.toFixed(2) + " ч."
              : "бесконечность"
          }`
        );
        const buyResult = await buyUpgrade(bestUpgrade.id);
        // console.log("Результат покупки:", buyResult);
      } else {
        console.log("Нет доступных для покупки апгрейдов");
      }
    } catch (error) {
      console.error("Ошибка в главном цикле:", error);
    }

    // Пауза перед следующей итерацией
    await new Promise((resolve) => setTimeout(resolve, 50000));
  }
}

main();
