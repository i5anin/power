// api.js

import axios from 'axios'
import { headers } from './config.js'

const WEB_URL = 'https://api.hamsterkombatgame.io/clicker'

const axiosInstance = axios.create({
  baseURL: WEB_URL,
  headers: headers
})

export const api = {
  tap: async () => {
    try {
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
      const response = await axiosInstance.post('/upgrades-for-buy')
      return response.data
    } catch (error) {
      console.error('Ошибка получения списка апгрейдов:', error)
      throw error
    }
  },
  buyUpgrade: async (upgradeId) => {
    try {
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
