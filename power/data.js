const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const { format } = require("date-fns");

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let data = [];

try {
  const fileData = fs.readFileSync("data.json", "utf8");
  data = JSON.parse(fileData);
} catch (err) {
  console.error(err);
}

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  const consumptionRegex = /\b(\d+([.,]\d+)?)\[?(\d{4}-\d{2}-\d{2})?\]?\b/;

  const match = messageText.match(consumptionRegex);

  if (match) {
    const consumption = parseFloat(match[1].replace(",", "."));
    const date = match[4] || format(new Date(), "yyyy-MM-dd'T'HH:mm");
    data.push({ x: date, y: consumption });
    fs.writeFileSync("data.json", JSON.stringify(data));
    bot.sendMessage(chatId, `Данные сохранены: ${consumption} на ${date}`);
  }
});

process.on("SIGINT", function () {
  fs.writeFileSync("data.json", JSON.stringify(data));
  process.exit();
});

bot.onText(/\/delete/, (msg) => {
  const chatId = msg.chat.id;
  if (data.length > 0) {
    data.pop();
    bot.sendMessage(chatId, "Последняя запись удалена");
  } else {
    bot.sendMessage(chatId, "Нет данных для удаления");
  }
});
