// main.js

import chalk from "chalk";
import {api} from "./api.js";

let currentBalance = null;

async function getBalance() {
    if (currentBalance === null) {
        const response = await api.tap();
        currentBalance = response.clickerUser.balanceCoins;
    }
    return currentBalance;
}

async function main() {
    while (true) {
        try {
            const balance = await getBalance();
            console.log(
                `[${new Date().toLocaleTimeString()}] ` +
                `Баланс: ` +
                `${chalk.yellow(balance.toFixed())}`
            );

            const data = await api.getUpgradesForBuy();
            const availableUpgrades = data.upgradesForBuy
                .filter(
                    (upgrade) =>
                        !upgrade.cooldownSeconds &&
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
                    `Покупаю ` +
                    `(место ${upgradeIndex} в топ-10):` +
                    `${bestUpgrade.section}: ${bestUpgrade.name} ${bestUpgrade.price}` +
                    `- окупаемость: ${bestUpgrade.paybackPeriod.toFixed(2)} ч.`
                );
                const buyResult = await api.buyUpgrade(bestUpgrade.id);
                // console.log("Результат покупки:", buyResult);
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
        await api.tap();
    } catch (error) {
        console.error("Ошибка при обновлении баланса:", error);
    }
}, 0.25 * 60 * 1000);
