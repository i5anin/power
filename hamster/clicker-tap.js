import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import fs from "fs";
import { headers } from "./config.js";

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/tap",
  method: "POST",
  headers: headers,
};

const data = JSON.stringify({
  availableTaps: 0,
  count: 12500 / 22,
  timestamp: Math.floor(Date.now() / 1000),
});

function sendRequest() {
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
        console.log(`Balance Coins: ${jsonData.clickerUser.balanceCoins}`);

        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${(
          "0" +
          (currentDate.getMonth() + 1)
        ).slice(-2)}-${("0" + currentDate.getDate()).slice(
          -2
        )} ${currentDate.getHours()} ${currentDate.getMinutes()} ${currentDate.getSeconds()}`;

        const fileName = `json/clicker-tap_${formattedDate}.json`;

        fs.writeFile(fileName, JSON.stringify(jsonData, null, 2), (err) => {
          if (err) {
            console.error("Ошибка записи в файл:", err);
          } else {
            console.log(`Данные успешно записаны в файл ${fileName}`);
          }
        });
      } catch (error) {
        console.error("Ошибка парсинга JSON:", error);
      }
    });
  });

  req.on("error", (error) => {
    console.error("Request error:", error);
  });

  req.write(data);
  req.end();
}

// Запускаем первый запрос сразу
sendRequest();

// Запускаем запросы каждые 25 минут
setInterval(sendRequest, 50 * 60 * 1000); // 50 минут * 60 секунд * 1000 миллисекунд
