import axios from 'axios'
import { headers } from './config.js'

// Определите переменную API_URL
const WEB_URL = 'https://api.hamsterkombatgame.io/clicker'

// Определите переменную окружения для API_KEY
const processNumber = process.env.PROCESS_NUMBER
const apiKey = process.env[`API_KEY_${processNumber}`]

// Создайте экземпляр axios с правильными заголовками
const axiosInstance = axios.create({
  baseURL: WEB_URL,
  headers: {
    ...headers,
    Authorization: `Bearer ${apiKey}` // Используем соответствующий ключ API
  }
})

// Экспортируйте объект api с методами
export const api = {
  tap: async () => {
    try {
      // Задержка перед вызовом API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1,5 секунды
      console.log('Вызов API tap')
      const response = await axiosInstance.post('/tap', {
        availableTaps: 0,
        count: 12500 / 22,
        timestamp: Math.floor(Date.now() / 1000)
      })
      return response.data
    } catch (error) {
      console.error('Ошибка выполнения запроса на tap:', error)
      throw error
    }
  },
  getUpgradesForBuy: async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1,5 секунды
      const response = await axiosInstance.post('/upgrades-for-buy')
      return response.data
    } catch (error) {
      console.error('Ошибка получения списка апгрейдов:', error)
      throw error
    }
  },
  buyUpgrade: async (upgradeId) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1,5 секунды
      const response = await axiosInstance.post('/buy-upgrade', {
        upgradeId: upgradeId,
        timestamp: Math.floor(Date.now() / 1000)
      })
      return response.data
    } catch (error) {
      console.error('Ошибка покупки апгрейда:', error)
      throw error
    }
  }
}
