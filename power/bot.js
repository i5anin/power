const TelegramBot = require("node-telegram-bot-api");

const dotenv = require("dotenv");
dotenv.config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Выбор 1", callback_data: "1" }],
        [{ text: "Выбор 2", callback_data: "2" }]
      ]
    })
  };
  bot.sendMessage(chatId, "Выберите опцию:", opts);
});

bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  let opts;
  switch (data) {
    case "1":
      opts = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Выбор 1.1", callback_data: "1.1" }],
            [{ text: "Выбор 1.2", callback_data: "1.2" }]
          ]
        })
      };
      bot.editMessageText("Выберите опцию:", {
        ...opts,
        chat_id: message.chat.id,
        message_id: message.message_id
      });
      break;
    case "1.1":
      opts = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Выбор 1.1.1", callback_data: "1.1.1" }],
            [{ text: "Выбор 1.1.2", callback_data: "1.1.2" }]
          ]
        })
      };
      bot.editMessageText("Выберите опцию:", {
        ...opts,
        chat_id: message.chat.id,
        message_id: message.message_id
      });
      break;
    case "1.2":
      opts = {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: "Выбор 1.2.1", callback_data: "1.2.1" }],
            [{ text: "Выбор 1.2.2", callback_data: "1.2.2" }]
          ]
        })
      };
      bot.editMessageText("Выберите опцию:", {
        ...opts,
        chat_id: message.chat.id,
        message_id: message.message_id
      });
      break;
    default:
      bot.answerCallbackQuery(callbackQuery.id);
  }
});
