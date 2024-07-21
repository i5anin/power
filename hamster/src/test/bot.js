import https from 'https'
import { gunzipSync, inflateSync, brotliDecompressSync } from 'zlib'
import fs from 'fs'
import { headers } from '../../hamster2/config.js'
import { getBalance } from '../../hamster2/balance.js'

async function getUpgradesForBuy() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.hamsterkombatgame.io',
      port: 443,
      path: '/clicker/upgrades-for-buy',
      method: 'POST',
      headers: headers
    }

    const req = https.request(options, (res) => {
      let responseData = []

      res.on('data', (chunk) => {
        responseData.push(chunk)
      })

      res.on('end', () => {
        try {
          let buffer = Buffer.concat(responseData)
          const encoding = res.headers['content-encoding']

          if (encoding === 'gzip') {
            buffer = gunzipSync(buffer)
          } else if (encoding === 'deflate') {
            buffer = inflateSync(buffer)
          } else if (encoding === 'br') {
            buffer = brotliDecompressSync(buffer)
          }

          const jsonData = JSON.parse(buffer.toString())

          if (res.statusCode === 400) {
            console.error('Ошибка:', jsonData.message)
            reject(new Error(jsonData.message))
            return
          }

          resolve(jsonData)
        } catch (error) {
          console.error('Ошибка парсинга JSON:', error)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request error:', error)
      reject(error)
    })

    req.end()
  })
}

function buyUpgrade(upgradeId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      upgradeId: upgradeId,
      timestamp: Math.floor(Date.now() / 1000)
    })

    const options = {
      hostname: 'api.hamsterkombatgame.io',
      port: 443,
      path: '/clicker/buy-upgrade',
      method: 'POST',
      headers: headers
    }

    const req = https.request(options, (res) => {
      let responseData = []

      res.on('data', (chunk) => {
        responseData.push(chunk)
      })

      res.on('end', () => {
        try {
          let buffer = Buffer.concat(responseData)
          const encoding = res.headers['content-encoding']

          if (encoding === 'gzip') {
            buffer = gunzipSync(buffer)
          } else if (encoding === 'deflate') {
            buffer = inflateSync(buffer)
          } else if (encoding === 'br') {
            buffer = brotliDecompressSync(buffer)
          }

          const jsonData = JSON.parse(buffer.toString())

          if (res.statusCode === 400) {
            console.error('Ошибка покупки:', jsonData.message)
            reject(new Error(jsonData.message))
            return
          }

          resolve(jsonData)
        } catch (error) {
          console.error('Ошибка парсинга JSON:', error)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      console.error('Request error:', error)
      reject(error)
    })

    req.write(data)
    req.end()
  })
}

async function main() {
  while (true) {
    try {
      // Получаем текущий баланс перед проверкой апгрейдов
      const balance = await getBalance()
      console.log(`Текущий баланс: ${balance}`)

      const data = await getUpgradesForBuy()
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
        .slice(0, 10) // Only consider the top 25 upgrades by payback period

      // Фильтруем доступные апгрейды, используя актуальный баланс
      const affordableUpgrades = availableUpgrades.filter(
        (upgrade) => upgrade.price <= balance
      )

      if (affordableUpgrades.length > 0) {
        const bestUpgrade = affordableUpgrades[0]
        const upgradeIndex = availableUpgrades.indexOf(bestUpgrade) + 1 // 1-based index
        console.log(
          `Покупаю (место ${upgradeIndex} в топ-10): ${bestUpgrade.section}: ${
            bestUpgrade.name
          } ${bestUpgrade.price} - окупаемость: ${
            bestUpgrade.paybackPeriod !== Infinity
              ? bestUpgrade.paybackPeriod.toFixed(2) + ' ч.'
              : 'бесконечность'
          }`
        )
        const buyResult = await buyUpgrade(bestUpgrade.id)
        // console.log("Результат покупки:", buyResult);
      } else {
        console.log('Нет доступных для покупки апгрейдов, подходящих по цене')
      }
    } catch (error) {
      console.error('Ошибка в главном цикле:', error)
    }

    // Пауза перед следующей итерацией Каждые 15 минут
    await new Promise((resolve) => setTimeout(resolve, 0.01 * 60 * 1000)) // 15 минут * 60 секунд * 1000 миллисекунд
  }
}

main()
