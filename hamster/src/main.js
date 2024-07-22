import chalk from 'chalk'
import readline from 'readline'
import { api } from './api.js'

// Получаем актуальный баланс и информацию о пассивном доходе
async function getBalance() {
  try {
    const response = await api.tap()
    return response.clickerUser // Возвращаем весь объект clickerUser
  } catch (error) {
    console.error('Ошибка при обновлении баланса:', error)
    if (error.response && error.response.status === 403) {
      console.error(chalk.red('Ошибка при обновлении баланса: ' + error.response.data.message))
    } else {
      console.error('Ошибка при обновлении баланса:', error)
    }
    return null
  }
}

// Функция для вывода информации о балансе и пассивном доходе
function logBalanceInfo(clickerUser) {
  const {
    balanceCoins: balance,
    earnPassivePerSec,
    earnPassivePerHour
  } = clickerUser

  if (earnPassivePerSec == null || earnPassivePerHour == null) {
    console.error('Недостаточно данных о пассивном доходе.')
    return
  }

  console.log(
    `[${new Date().toLocaleTimeString()}] ` +
    `• Баланс: ${chalk.yellow(Math.round(balance).toLocaleString())} ` +
    `• Прирост: ${chalk.yellow(earnPassivePerHour.toLocaleString())} в час ` +
    `${chalk.yellow(earnPassivePerSec.toLocaleString())} в сек `
  )
}

// Функция для расчета времени до покупки апгрейда
function calculateTimeToBuy(clickerUser, nearestUpgrade) {
  const priceDifference = nearestUpgrade.price - clickerUser.balanceCoins
  const secondsToBuy = Math.ceil(priceDifference / clickerUser.earnPassivePerSec)
  const hoursToBuy = Math.floor(secondsToBuy / 3600)
  const minutesToBuy = Math.floor((secondsToBuy % 3600) / 60)
  const secondsLeft = Math.round(secondsToBuy % 60) // Округляем до секунд

  return {
    hoursToBuy,
    minutesToBuy,
    secondsLeft
  }
}

// Функция для управления циклом выполнения бота
async function runBot() {
  let cooldown = 0 // Переменная для "cooldown"
  let backoffMultiplier = 1 // Множитель для "backoff"

  while (true) {
    try {
      // Получаем актуальный баланс и информацию о пассивном доходе
      let clickerUser = await getBalance()
      if (!clickerUser) {
        console.log(chalk.red('Не удалось получить данные о пользователе.'))
        await new Promise((resolve) => setTimeout(resolve, 1500)) // Ожидание перед новой попыткой
        continue
      }

      // Выводим информацию о балансе
      logBalanceInfo(clickerUser)

      while (true) {
        // Обновляем баланс и информацию о пассивном доходе перед каждой проверкой апгрейдов
        clickerUser = await getBalance()
        if (!clickerUser) {
          console.log(chalk.red('Не удалось получить данные о пользователе.'))
          await new Promise((resolve) => setTimeout(resolve, 1500)) // Ожидание перед новой попыткой
          continue
        }

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
          (upgrade) => upgrade.price <= clickerUser.balanceCoins
        )

        // Если есть доступные апгрейды, покупаем лучший
        if (affordableUpgrades.length > 0) {
          const bestUpgrade = affordableUpgrades[0]
          const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1
          console.log(
            chalk.magenta(`Покупаю (место ${upgradeIndex} в топ-10): `) +
            `${bestUpgrade.section}: ${bestUpgrade.name} ${chalk.yellow(bestUpgrade.price.toLocaleString())} ` +
            `- окупаемость: ${chalk.blue(bestUpgrade.paybackPeriod.toFixed(2))} ч.`
          )

          try {
            const buyResult = await api.buyUpgrade(bestUpgrade.id)
            // Проверяем, был ли успешный ответ
            if (buyResult.clickerUser && buyResult.clickerUser.upgrades) {
              console.log(chalk.green('Апгрейд куплен успешно!'))
              // Обновляем баланс после успешной покупки
              clickerUser = await getBalance()
              if (!clickerUser) {
                console.log(chalk.red('Не удалось получить данные о пользователе.'))
                await new Promise((resolve) => setTimeout(resolve, 60 * 1000)) // Ожидание перед новой попыткой
                continue
              }

              // Выводим обновленную информацию о балансе
              logBalanceInfo(clickerUser)

              cooldown = 5 * 1000 // 5 секунд cooldown после успешной покупки
              backoffMultiplier = 1 // Сбрасываем backoff multiplier
            } else if (buyResult.error_code === 'INSUFFICIENT_FUNDS') {
              console.log(chalk.red(`Ошибка: Недостаточно средств для покупки.`))
              affordableUpgrades.shift() // Удаляем апгрейд из списка доступных
            } else {
              console.log(chalk.red(`Ошибка при покупке апгрейда: ${JSON.stringify(buyResult, null, 2)}`))
              affordableUpgrades.shift() // Удаляем апгрейд из списка доступных
              cooldown = 10 * 1000 // 10 секунд cooldown при ошибке
              backoffMultiplier *= 2 // Увеличиваем backoff multiplier
            }
          } catch (error) {
            console.error(chalk.red(`Ошибка при покупке апгрейда: ${error}`))
            affordableUpgrades.shift() // Удаляем апгрейд из списка доступных
            cooldown = 10 * 1000 // 10 секунд cooldown при ошибке
            backoffMultiplier *= 2 // Увеличиваем backoff multiplier
          }
        } else {
          console.log(
            chalk.red('Нет доступных для покупки апгрейдов, подходящих по цене')
          )

          // Находим ближайший доступный апгрейд
          const nearestUpgrade = availableUpgrades
            .filter((upgrade) => upgrade.price > clickerUser.balanceCoins)
            .sort((a, b) => a.price - b.price)[0]

          // Выводим информацию о ближайшем апгрейде
          if (nearestUpgrade) {
            const { hoursToBuy, minutesToBuy, secondsLeft } = calculateTimeToBuy(clickerUser, nearestUpgrade)

            console.log(
              `Ближайший доступный апгрейд: ${nearestUpgrade.section}: ` +
              `${chalk.blue(nearestUpgrade.name)} ${chalk.yellow(nearestUpgrade.price.toLocaleString())} ` +
              `- окупаемость: ${nearestUpgrade.paybackPeriod !== Infinity ? nearestUpgrade.paybackPeriod.toFixed(2) + ' ч.' : 'бесконечность'} ` +
              chalk.blue(
                `\n Время до покупки: ${hoursToBuy}ч ${minutesToBuy}м ${secondsLeft}с` // Изменения: Добавлено Math.round(secondsLeft)
              )
            )

            // Ожидание, пока не станет достаточно денег
            await new Promise((resolve) => setTimeout(resolve, secondsLeft * 1000))
            continue // Продолжаем цикл
          } else {
            console.log(chalk.blue('Нет апгрейдов для показа.'))
          }
          break // Выходим из внутреннего цикла, если нет доступных апгрейдов
        }
      }

      // Генерируем случайное количество минут от 30 до 60
      const minMinutes = 30
      const maxMinutes = 60
      const randomMinutes =
        Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
      // Ожидание случайное количество минут
      const waitTime = randomMinutes * 60 * 1000 + cooldown // Преобразуем минуты в миллисекунды

      console.log('waitTime = ', waitTime)

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      // Запрос к пользователю о продолжении
      rl.question(
        chalk.blue('Завершить выполнение пакетного файла [Y(да)/N(нет)]? '),
        (answer) => {
          rl.close()
          if (answer.toLowerCase() === 'y') {
            process.exit(0) // Завершаем выполнение скрипта
          } else {
            // Пробуем продолжить выполнение скрипта
            new Promise((resolve) => setTimeout(resolve, waitTime))
              .then(() => {
                runBot()
              })
              .catch((error) => {
                console.error('Ошибка в главном цикле:', error)
              })
          }
        }
      )
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }
  }
}

runBot() // Запускаем бота