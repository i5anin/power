import chalk from 'chalk'
import { api } from './api.js'

let currentBalance = null

// Получаем актуальный баланс, вызывая api.tap()
async function getBalance() {
  try {
    const response = await api.tap()
    currentBalance = response.clickerUser.balanceCoins
  } catch (error) {
    console.error('Ошибка при обновлении баланса:', error)
  }
  return currentBalance
}

async function main() {
  while (true) {
    try {
      // Получаем актуальный баланс
      const balance = await getBalance()
      console.log(
        `[${new Date().toLocaleTimeString()}] ` +
          `Баланс: ` +
          `${chalk.yellow(balance.toFixed())}`
      )

      // Получаем список доступных апгрейдов
      const data = await api.getUpgradesForBuy()
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
        .slice(0, 10)

      // Фильтруем апгрейды по цене
      const affordableUpgrades = availableUpgrades.filter(
        (upgrade) => upgrade.price <= balance
      )

      // Если есть доступные апгрейды, покупаем лучший
      if (affordableUpgrades.length > 0) {
        const bestUpgrade = affordableUpgrades[0]
        const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1
        console.log(
          `Покупаю ` +
            `(место ${upgradeIndex} в топ-10):` +
            `${bestUpgrade.section}: ${bestUpgrade.name} ${bestUpgrade.price}` +
            `- окупаемость: ${bestUpgrade.paybackPeriod.toFixed(2)} ч.`
        )
        await api.buyUpgrade(bestUpgrade.id)
      } else {
        console.log(
          chalk.red('Нет доступных для покупки апгрейдов, подходящих по цене')
        )

        // Находим ближайший доступный апгрейд
        const nearestUpgrade = availableUpgrades
          .filter((upgrade) => upgrade.price > balance)
          .sort((a, b) => a.price - b.price)[0]

        // Выводим информацию о ближайшем апгрейде
        if (nearestUpgrade) {
          console.log(
            chalk.blue(
              `Ближайший доступный апгрейд: ${nearestUpgrade.section}: ` +
                `${nearestUpgrade.name} ${nearestUpgrade.price} ` +
                `- окупаемость: ${
                  nearestUpgrade.paybackPeriod !== Infinity
                    ? nearestUpgrade.paybackPeriod.toFixed(2) + ' ч.'
                    : 'бесконечность'
                }`
            )
          )
        } else {
          console.log(chalk.blue('Нет апгрейдов для показа.'))
        }
      }
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }

    // Ждём 6 секунд
    await new Promise((resolve) => setTimeout(resolve, 6 * 1000))
  }
}

main()
