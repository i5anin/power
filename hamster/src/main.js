import chalk from 'chalk'
import { api } from './api.js'

// Получаем актуальный баланс и информацию о пассивном доходе
async function getBalance() {
  try {
    const response = await api.tap()
    return response.clickerUser // Возвращаем весь объект clickerUser
  } catch (error) {
    console.error('Ошибка при обновлении баланса:', error)
    return null
  }
}

async function main() {
  while (true) {
    try {
      // Получаем актуальный баланс и информацию о пассивном доходе
      const clickerUser = await getBalance()
      if (!clickerUser) continue // Если произошла ошибка при получении данных, пропускаем итерацию

      const {
        balanceCoins: balance,
        earnPassivePerSec,
        earnPassivePerHour
      } = clickerUser

      console.log(
        `[${new Date().toLocaleTimeString()}] ` +
          `• Баланс: ` +
          `${chalk.yellow(Math.round(balance).toLocaleString())} ` +
          `• Прирост: ` +
          `${chalk.yellow(earnPassivePerHour.toLocaleString())} в час ` +
          `${chalk.yellow(earnPassivePerSec.toLocaleString())} в сек `
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
          const priceDifference = nearestUpgrade.price - balance
          const secondsToBuy = Math.ceil(priceDifference / earnPassivePerSec)
          const hoursToBuy = Math.floor(secondsToBuy / 3600)
          const minutesToBuy = Math.floor((secondsToBuy % 3600) / 60)
          const secondsLeft = secondsToBuy % 60

          console.log(
            chalk.blue(
              `Ближайший доступный апгрейд: ${nearestUpgrade.section}: ` +
                `${nearestUpgrade.name} ${nearestUpgrade.price.toLocaleString()} ` +
                `- окупаемость: ${
                  nearestUpgrade.paybackPeriod !== Infinity
                    ? nearestUpgrade.paybackPeriod.toFixed(2) + ' ч.'
                    : 'бесконечность'
                }` +
                `\n Время до покупки: ${hoursToBuy}ч ${minutesToBuy}м ${secondsLeft}с`
            )
          )

          // Проверяем, пришло ли время покупать
          if (hoursToBuy === 0 && minutesToBuy === 0 && secondsLeft <= 6) {
            console.log(chalk.green('Пришло время покупать!'))
            await api.buyUpgrade(nearestUpgrade.id)
            // После покупки сбрасываем availableUpgrades, чтобы не пытаться купить тот же апгрейд снова
            availableUpgrades.length = 0
          }
        } else {
          console.log(chalk.blue('Нет апгрейдов для показа.'))
        }
      }
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }

    // Ждём 20 минут
    await new Promise((resolve) => setTimeout(resolve, 20 * 60 * 1000))
  }
}

main()
