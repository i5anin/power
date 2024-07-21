import axios from "axios";
import chalk from "chalk"; // Библиотека для цветного вывода в консоль
import { headers } from "./config.js";

// --- Упрощение логики с помощью Axios ---

// Создаем экземпляр Axios с базовыми настройками
const api = axios.create({
  baseURL: "https://api.hamsterkombatgame.io/clicker", // Базовый URL API
  method: "POST", // Метод по умолчанию
  headers: headers
});

// --- Функции для работы с API ---

// Получение баланса
async function getBalance() {
  try {
    const response = await api.post("/tap", {
      // Используем api экземпляр
      availableTaps: 0,
      count: 12500 / 22,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return response.data.clickerUser.balanceCoins;
  } catch (error) {
    console.error("Ошибка получения баланса:", error);
    throw error; // Пробрасываем ошибку дальше
  }
}

// Получение списка апгрейдов
async function getUpgradesForBuy() {
  try {
    const response = await api.post("/upgrades-for-buy");
    return response.data.upgradesForBuy;
  } catch (error) {
    console.error("Ошибка получения списка апгрейдов:", error);
    throw error;
  }
}

// Покупка апгрейда
async function buyUpgrade(upgradeId) {
  try {
    const response = await api.post("/buy-upgrade", {
      upgradeId,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка покупки апгрейда:", error);
    throw error;
  }
}

// --- Основной цикл ---

async function main() {
  while (true) {
    try {
      const balance = await getBalance();
      console.log(
        `Текущий баланс: ${balance} (Дата и время: ${new Date().toLocaleString()})`
      );

      const availableUpgrades = await getUpgradesForBuy();
      const affordableUpgrades = availableUpgrades
        .filter(
          (upgrade) =>
            (upgrade.cooldownSeconds === 0 ||
              upgrade.cooldownSeconds === undefined) &&
            upgrade.isAvailable &&
            !upgrade.isExpired &&
            upgrade.price <= balance // Фильтрация по цене здесь
        )
        .map((upgrade) => ({
          ...upgrade,
          paybackPeriod: upgrade.profitPerHour
            ? upgrade.price / upgrade.profitPerHour
            : Infinity
        }))
        .sort((a, b) => a.paybackPeriod - b.paybackPeriod)
        .slice(0, 25);

      if (affordableUpgrades.length > 0) {
        const bestUpgrade = affordableUpgrades[0];
        const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1;
        console.log(
          `Покупаю (место ${upgradeIndex} в топ-25): ${bestUpgrade.section}: ${
            bestUpgrade.name
          } ${bestUpgrade.price} - окупаемость: ${
            bestUpgrade.paybackPeriod !== Infinity
              ? bestUpgrade.paybackPeriod.toFixed(2) + " ч."
              : "бесконечность"
          }`
        );
        await buyUpgrade(bestUpgrade.id);
      } else {
        console.log(
          chalk.red(
            " ! Нет доступных для покупки апгрейдов, подходящих по цене"
          )
        ); // Красный вывод
      }
    } catch (error) {
      console.error("Ошибка в главном цикле:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000)); // Пауза 5 минут
  }
}

main();

// --- Дополнительные улучшения ---

// 1. Использован `chalk` для цветного вывода в консоль.
// 2. Создан экземпляр `axios` для упрощения запросов.
// 3. Ошибки пробрасываются дальше для централизованной обработки.
// 4. Улучшена читаемость кода.
