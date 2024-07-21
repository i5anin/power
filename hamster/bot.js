import axios from "axios";
import { headers } from "./config.js";
import chalk from "chalk";

let currentBalance = null;
const WEB_URL = "https://api.hamsterkombatgame.io/clicker";

const options = {
  url: WEB_URL + "/tap",
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
    currentBalance = response.data.clickerUser.balanceCoins;
    return currentBalance;
  } catch (error) {
    console.error("Ошибка выполнения запроса:", error);
    throw error;
  }
}

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

async function getUpgradesForBuy() {
  try {
    const response = await axios({
      url: WEB_URL + "/upgrades-for-buy",
      method: "POST",
      headers: headers
    });
    return response.data;
  } catch (error) {
    console.error("Ошибка получения списка апгрейдов:", error);
    throw error;
  }
}

async function buyUpgrade(upgradeId) {
  try {
    const response = await axios({
      url: WEB_URL + "/buy-upgrade",
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

async function main() {
  while (true) {
    try {
      const balance = await getBalance();
      console.log(
        `Текущий баланс: ${chalk.yellow(
          balance.toFixed()
        )} (Время: ${new Date().toLocaleTimeString()})`
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
        .slice(0, 10);

      const affordableUpgrades = availableUpgrades.filter(
        (upgrade) => upgrade.price <= balance
      );

      if (affordableUpgrades.length > 0) {
        const bestUpgrade = affordableUpgrades[0];
        const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1;
        console.log(
          `Покупаю (место ${upgradeIndex} в топ-10): ${bestUpgrade.section}: ${
            bestUpgrade.name
          } ${
            bestUpgrade.price
          } - окупаемость: ${bestUpgrade.paybackPeriod.toFixed(2)} ч.`
        );
        const buyResult = await buyUpgrade(bestUpgrade.id);
        console.log("Результат покупки:", buyResult);
      } else {
        console.log(
          chalk.red("Нет доступных для покупки апгрейдов, подходящих по цене")
        );
      }
    } catch (error) {
      console.error("Ошибка в главном цикле:", error);
    }

    await new Promise((resolve) => setTimeout(resolve, 0.1 * 60 * 1000));
  }
}

main();

setInterval(async () => {
  try {
    await sendRequest();
  } catch (error) {
    console.error("Ошибка при обновлении баланса:", error);
  }
}, 0.25 * 60 * 1000);
