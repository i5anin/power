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
      let clickerUser = await getBalance()
      if (!clickerUser) {
        console.log(chalk.red('Не удалось получить данные о пользователе.'))
        await new Promise((resolve) => setTimeout(resolve,  1500)) // Ожидание перед новой попыткой
        continue
      }

      let {
        balanceCoins: balance,
        earnPassivePerSec,
        earnPassivePerHour
      } = clickerUser

      if (earnPassivePerSec == null || earnPassivePerHour == null) {
        console.error('Недостаточно данных о пассивном доходе.')
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000)) // Ожидание перед новой попыткой
        continue
      }

      console.log(
        `[${new Date().toLocaleTimeString()}] ` +
        `• Баланс: ${chalk.yellow(Math.round(balance).toLocaleString())} ` +
        `• Прирост: ${chalk.yellow(earnPassivePerHour.toLocaleString())} в час ` +
        `${chalk.yellow(earnPassivePerSec.toLocaleString())} в сек `
      )

      while (true) {
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
          const bestUpgrade = affordableUpgrades[0];
          const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1;
          console.log(
            chalk.magenta(`Покупаю (место ${upgradeIndex} в топ-10): `) +
            `${bestUpgrade.section}: ${bestUpgrade.name} ${chalk.yellow(bestUpgrade.price.toLocaleString())} ` +
            `- окупаемость: ${chalk.blue(bestUpgrade.paybackPeriod.toFixed(2))} ч.`
          );

          try {
            const buyResult = await api.buyUpgrade(bestUpgrade.id);
            // Проверяем, был ли успешный ответ
            if (buyResult.clickerUser && buyResult.clickerUser.upgrades) {
              console.log(chalk.green('Апгрейд куплен успешно!'));
              // Обновляем баланс после успешной покупки
              clickerUser = await getBalance();
              if (!clickerUser) {
                console.log(chalk.red('Не удалось получить данные о пользователе.'))
                await new Promise((resolve) => setTimeout(resolve, 60 * 1000)) // Ожидание перед новой попыткой
                continue
              }
              balance = clickerUser.balanceCoins;
              earnPassivePerSec = clickerUser.earnPassivePerSec;
              earnPassivePerHour = clickerUser.earnPassivePerHour;

              console.log(
                `[${new Date().toLocaleTimeString()}] ` +
                `• Баланс: ${chalk.yellow(Math.round(balance).toLocaleString())} ` +
                `• Прирост: ${chalk.yellow(earnPassivePerHour.toLocaleString())} в час ` +
                `${chalk.yellow(earnPassivePerSec.toLocaleString())} в сек `
              );
            } else if (buyResult.error_code === 'INSUFFICIENT_FUNDS') {
              console.log(chalk.red(`Ошибка: Недостаточно средств для покупки.`));
              affordableUpgrades.shift(); // Удаляем апгрейд из списка доступных
            } else {
              console.log(chalk.red(`Ошибка при покупке апгрейда: ${JSON.stringify(buyResult, null, 2)}`));
              affordableUpgrades.shift(); // Удаляем апгрейд из списка доступных
            }
          } catch (error) {
            console.error(chalk.red(`Ошибка при покупке апгрейда: ${error}`));
            affordableUpgrades.shift(); // Удаляем апгрейд из списка доступных
          }
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
              `Ближайший доступный апгрейд: ${nearestUpgrade.section}: ` +
              `${chalk.blue(nearestUpgrade.name)} ${chalk.yellow(nearestUpgrade.price.toLocaleString())} ` +
              `- окупаемость: ${nearestUpgrade.paybackPeriod !== Infinity ? nearestUpgrade.paybackPeriod.toFixed(2) + ' ч.' : 'бесконечность'} ` +
              chalk.blue(
                `\n Время до покупки: ${hoursToBuy}ч ${minutesToBuy}м ${secondsLeft}с`
              )
            )

            // Ожидание, пока не станет достаточно денег
            if (hoursToBuy > 0 || minutesToBuy > 0 || secondsLeft > 6) {
              await new Promise((resolve) => setTimeout(resolve, secondsLeft * 1000));
              continue; // Продолжаем цикл
            }
          } else {
            console.log(chalk.blue('Нет апгрейдов для показа.'))
          }
          break; // Выходим из внутреннего цикла, если нет доступных апгрейдов
        }
      }

      // Генерируем случайное количество минут от 15 до 30
      const minMinutes = 15
      const maxMinutes = 30
      const randomMinutes =
        Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes
      // Ожидание случайное количество минут
      const waitTime = randomMinutes * 60 * 1000 // Преобразуем минуты в миллисекунды
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }
  }
}

main()
