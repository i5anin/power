import chalk from 'chalk'
import { api } from './api.js'

// Функция для форматирования времени
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return `${hours}ч ${minutes}м ${remainingSeconds}с`
}

async function main() {
  let secondsToBuy = Infinity // Изначально время до покупки бесконечно
  let lastUpdateTime = 0 // Время последнего обновления информации

  while (true) {
    try {
      // Обновляем информацию каждые 5 минут или если время до покупки не определено
      if (
        Date.now() - lastUpdateTime >= 5 * 60 * 1000 ||
        secondsToBuy === Infinity
      ) {
        // Получаем актуальный баланс и информацию о пассивном доходе
        const clickerUser = await getBalance()
        if (!clickerUser) continue

        const {
          balanceCoins: balance,
          earnPassivePerSec,
          earnPassivePerHour
        } = clickerUser

        // Выводим информацию о текущем состоянии счета
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

        // Находим ближайший доступный апгрейд
        const nearestUpgrade = availableUpgrades.find(
          (upgrade) => upgrade.price > balance
        )

        // Если есть ближайший апгрейд, вычисляем время до его покупки
        if (nearestUpgrade) {
          const priceDifference = nearestUpgrade.price - balance
          secondsToBuy = Math.ceil(priceDifference / earnPassivePerSec)

          console.log(
            chalk.blue(
              `Ближайший апгрейд: ${nearestUpgrade.name} (${nearestUpgrade.price.toLocaleString()})`
            )
          )
        } else {
          secondsToBuy = Infinity
          console.log(chalk.blue('Нет доступных апгрейдов для покупки.'))
        }

        lastUpdateTime = Date.now()
      }

      // Выводим время до покупки
      console.log(chalk.blue(`Время до покупки: ${formatTime(secondsToBuy)}`))

      // Проверяем, пришло ли время покупать, каждую секунду
      if (secondsToBuy <= 0) {
        console.log(chalk.green('Пришло время покупать!'))

        // Получаем ID ближайшего апгрейда (он мог измениться)
        const data = await api.getUpgradesForBuy()
        const nearestUpgrade = data.upgradesForBuy.find(
          (upgrade) => upgrade.price > balance
        )

        if (nearestUpgrade) {
          await api.buyUpgrade(nearestUpgrade.id)
          secondsToBuy = Infinity // Сбрасываем время до покупки
          lastUpdateTime = 0 // Обновляем время последнего обновления, чтобы получить данные о новом апгрейде
        }
      } else {
        secondsToBuy-- // Уменьшаем время до покупки каждую секунду
      }
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }

    // Ждём 1 секунду
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

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

main()
