import https from "https";
import { gunzipSync, inflateSync, brotliDecompressSync } from "zlib";

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/tap",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer 1721289506775rN4EWfZj6fAYcxzC8rGYhdQGaFHCdHTGKA2Q3PrJ2nB2DlGsP0LXpxFSEWpTFZBL6522743169", // Замените на ваш актуальный токен
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Dnt: "1",
    Origin: "https://hamsterkombatgame.io",
    Pragma: "no-cache",
    Priority: "u=1, i",
    Referer: "https://hamsterkombatgame.io/",
    "Sec-Ch-Ua":
      '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  },
};

const data = JSON.stringify({
  availableTaps: 9676, // осаток
  count: 18, // клики
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
      console.log(`Balance Coins: ${jsonData.clickerUser.balanceCoins}`);
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
