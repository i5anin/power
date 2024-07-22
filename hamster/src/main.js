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

      let upgradePurchased = false; // Флаг, отслеживающий успешную покупку

      do {
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
        upgradePurchased = false;
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
              upgradePurchased = true;
              clickerUser = buyResult.clickerUser; // Обновляем данные пользователя
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
              upgradePurchased = false;
            } else {
              console.log(chalk.red(`Ошибка при покупке апгрейда: ${JSON.stringify(buyResult, null, 2)}`));
              upgradePurchased = false;
            }
          } catch (error) {
            console.error(chalk.red(`Ошибка при покупке апгрейда: ${error}`));
            upgradePurchased = false;
          }
        }
      } while (upgradePurchased);

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
