const https = require("https");

const options = {
  hostname: "api.hamsterkombatgame.io",
  port: 443,
  path: "/clicker/tap",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer 1721286018267pTT5u2xltkvWbpvEjmFYIxFK3cD3RyOEkr05QjSRzmbLucVnu5PcWU9PsgUJCnT5390895078",
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
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
  availableTaps: 9676, // Замените на ваше значение availableTaps
  count: 18,
  timestamp: Math.floor(Date.now() / 1000), // Текущий timestamp
});

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on("data", (d) => {
    process.stdout.write(d);
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(data);
req.end();
