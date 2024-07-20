import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";
import { headers } from "./config.js"; // Assuming you have config.js

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/tap",
  method: "POST",
  headers: headers
};

const data = JSON.stringify({
  availableTaps: 0,
  count: 18000,
  timestamp: Math.floor(Date.now() / 1000)
});

function sendRequest() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      // console.log(`statusCode: ${res.statusCode}`);

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
          resolve(jsonData.clickerUser.balanceCoins);
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

// Запускаем первый запрос сразу
sendRequest()
  .then((balance) => {
    // console.log("Баланс монет:", balance);
    return balance;
  })
  .catch((error) => {
    console.error("Ошибка:", error);
  });

// Запускаем запросы каждые 25 минут
setInterval(sendRequest, 50 * 60 * 1000);

// Функция для получения баланса
export async function getBalance() {
  try {
    const balance = await sendRequest();
    return balance;
  } catch (error) {
    console.error("Ошибка получения баланса:", error);
    return null;
  }
}
