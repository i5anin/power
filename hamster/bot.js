import axios from "axios";
import { headers } from "./config.js";

let currentBalance = null;

const options = {
  url: "https://api.hamsterkombatgame.io/clicker/tap",
  method: "POST",
  headers: headers,
  data: {
    availableTaps: 0,
    count: 12500 / 22,
    timestamp: Math.floor(Date.now() / 1000)
  }
};

async function sendRequest() {
  try {
    const response = await axios(options);
    currentBalance = response.data.clickerUser.balanceCoins; // Обновляем текущий баланс
    return currentBalance;
  } catch (error) {
    console.error("Ошибка выполнения запроса:", error);
    throw error;
  }
}

// Функция для получения баланса
export async function getBalance() {
  if (currentBalance === null) {
    try {
      currentBalance = await sendRequest();
    } catch (error) {
      console.error("Ошибка получения баланса:", error);
      return null;
    }
  }
  return currentBalance;
}

// Функция для получения списка апгрейдов
async function getUpgradesForBuy() {
  try {
    const response = await axios({
      url: "https://api.hamsterkombatgame.io/clicker/upgrades-for-buy",
      method: "POST",
      headers: headers
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка получения списка апгрейдов:", error);
    throw error;
  }
}

// Функция для покупки апгрейда
async function buyUpgrade(upgradeId) {
  try {
    const response = await axios({
      url: "https://api.hamsterkombatgame.io/clicker/buy-upgrade",
      method: "POST",
      headers: headers,
      data: {
        upgradeId: upgradeId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка покупки апгрейда:", error);
    throw error;
  }
}

// Основной цикл для покупки апгрейдов
async function main() {
  while (true) {
    try {
      const balance = await getBalance();
      console.log(
        `Текущий баланс: ${balance} (Дата и время: ${new Date().toLocaleString()})`
      );

      const data = await getUpgradesForBuy();
      const availableUpgrades = data.upgradesForBuy
        .filter(
          (upgrade) =>
            (upgrade.cooldownSeconds === 0 ||
              upgrade.cooldownSeconds === undefined) &&
            upgrade.isAvailable &&
            !upgrade.isExpired
        )
        .map((upgrade) => ({
          ...upgrade,
          paybackPeriod: upgrade.profitPerHour
            ? upgrade.price / upgrade.profitPerHour
            : Infinity
        }))
        .sort((a, b) => a.paybackPeriod - b.paybackPeriod)
        .slice(0, 10); // Рассматриваем только топ-10 апгрейдов по периоду окупаемости

      const affordableUpgrades = availableUpgrades.filter(
        (upgrade) => upgrade.price <= balance
      );

      if (affordableUpgrades.length > 0) {
        const bestUpgrade = affordableUpgrades[0];
        const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1; // Индекс начинается с 1
        console.log(
          `Покупаю (место ${upgradeIndex} в топ-10): ${bestUpgrade.section}: ${
            bestUpgrade.name
          } ${bestUpgrade.price} - окупаемость: ${
            bestUpgrade.paybackPeriod !== Infinity
              ? bestUpgrade.paybackPeriod.toFixed(2) + " ч."
              : "бесконечность"
          }`
        );
        const buyResult = await buyUpgrade(bestUpgrade.id);
        console.log("Результат покупки:", buyResult);
      } else {
        console.log("Нет доступных для покупки апгрейдов, подходящих по цене");
      }
    } catch (error) {
      console.error("Ошибка в главном цикле:", error);
    }

    // Пауза перед следующей итерацией (5 минут)
    await new Promise((resolve) => setTimeout(resolve, 0.1 * 60 * 1000)); // 5 минут * 60 секунд * 1000 миллисекунд
  }
}

main();

// Запускаем запросы каждые 25 минут
setInterval(async () => {
  try {
    await sendRequest();
  } catch (error) {
    console.error("Ошибка при обновлении баланса:", error);
  }
}, 0.25 * 60 * 1000); // 25 минут
