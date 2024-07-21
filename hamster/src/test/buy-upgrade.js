import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import fs from "fs";
import { headers } from "../config.js"; // Импорт options из config.js

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/upgrades-for-buy",
  method: "POST",
  headers: headers, // Используем экспортированные headers
};

const data = JSON.stringify({
  upgradeId: "development_hub_mumbai", // todo: сюда вставить самый доступные
  timestamp: Math.floor(Date.now() / 1000),
});

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
      const fileName = `json/buy-upgrade_${formattedDate}.json`;

      // Записываем данные в файл
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
