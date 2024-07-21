import https from 'https'
import { gunzipSync, inflateSync, brotliDecompressSync } from 'zlib'
import fs from 'fs'
import { headers } from '../config.js'
import Table from 'cli-table' // Импортируем библиотеку cli-table

const options = {
  hostname: 'api.hamsterkombatgame.io',
  port: 443,
  path: '/clicker/upgrades-for-buy',
  method: 'POST',
  headers: headers
}

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`)

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
        return
      }

      // Фильтруем апгрейды
      const availableUpgrades = jsonData.upgradesForBuy.filter(
        (upgrade) =>
          !upgrade.cooldownSeconds && // Без кулдауна
          upgrade.isAvailable && // Доступный
          !upgrade.isExpired // Не истёк
      )

      const upgradesWithPayback = availableUpgrades.map((upgrade) => ({
        ...upgrade,
        paybackPeriod: upgrade.profitPerHour
          ? upgrade.price / upgrade.profitPerHour
          : Infinity
      }))

      const sortedUpgrades = upgradesWithPayback.sort(
        (a, b) => a.paybackPeriod - b.paybackPeriod
      )

      // Создаем таблицу
      const table = new Table({
        head: ['№', 'Секция', 'Название', 'Цена', 'Дельта', 'Окупаемость'],
        colWidths: [5, 10, 25, 15, 10, 15]
      })

      // Добавляем данные в таблицу
      sortedUpgrades.forEach((upgrade, index) => {
        table.push([
          index + 1,
          upgrade.section,
          upgrade.name,
          upgrade.price.toLocaleString(),
          upgrade.profitPerHourDelta.toLocaleString(),
          upgrade.paybackPeriod !== Infinity
            ? upgrade.paybackPeriod.toFixed(2) + ' ч.'
            : 'бесконечность'
        ])
      })

      // Выводим таблицу в консоль
      console.log(table.toString())
    } catch (error) {
      console.error('Ошибка парсинга JSON:', error)
    }
  })
})

req.on('error', (error) => {
  console.error('Request error:', error)
})

req.end()
