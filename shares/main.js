const app = Vue.createApp({
  data() {
    return {
      data: {
        shares: [],
        funds: [],
        crypto: []
      }
    };
  },
  async mounted() {
    try {
      const response = await fetch("data.json");
      if (!response.ok) {
        throw new Error("Failed to fetch data.json");
      }
      const jsonData = await response.json();
      const exchangeRate = await getExchangeRate("USD", "RUB");

      if (jsonData.shares) {
        for (const item of jsonData.shares) {
          this.data.shares.push({
            label: item.label,
            book_value: item.book_value,
            current_price: await getStockPrice(item.label, item.currency),
            change:
              (
                (((await getStockPrice(item.label, item.currency)) -
                  item.book_value) /
                  item.book_value) *
                100
              ).toFixed(2) + "%",
            currency: item.currency
          });
        }
      }

      if (jsonData.funds) {
        for (const item of jsonData.funds) {
          this.data.funds.push({
            label: item.label,
            book_value: item.book_value,
            current_price: await getFundPrice(item.label, item.currency),
            change:
              (
                (((await getFundPrice(item.label, item.currency)) -
                  item.book_value) /
                  item.book_value) *
                100
              ).toFixed(2) + "%",
            currency: item.currency
          });
        }
      }

      if (jsonData.crypto) {
        for (const item of jsonData.crypto) {
          this.data.crypto.push({
            label: item.label,
            book_value: item.book_value,
            current_price: await getCryptoPrice(item.label, item.currency),
            change:
              (
                (((await getCryptoPrice(item.label, item.currency)) -
                  item.book_value) /
                  item.book_value) *
                100
              ).toFixed(2) + "%",
            currency: item.currency
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
});

async function getStockPrice(ticker, currency) {
  try {
    const response = await fetch(
      `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch stock data");
    }
    const data = await response.json();
    let currentPrice = data.marketdata.data[0][11];
    if (currency === "USD") {
      const exchangeRate = await getExchangeRate("USD", "RUB");
      currentPrice /= exchangeRate;
    }
    return currentPrice.toFixed(2);
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function getFundPrice(symbol, currency) {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}RUB`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch fund data");
    }
    const data = await response.json();
    let currentPrice = parseFloat(data.price);
    if (currency === "USD") {
      const exchangeRate = await getExchangeRate("USD", "RUB");
      currentPrice /= exchangeRate;
    }
    return currentPrice.toFixed(2);
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function getCryptoPrice(symbol, currency) {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch crypto data");
    }
    const data = await response.json();
    let currentPrice = parseFloat(data.price);
    if (currency === "RUB") {
      const exchangeRate = await getExchangeRate("USD", "RUB");
      currentPrice *= exchangeRate;
    }
    return currentPrice.toFixed(2);
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }
    const data = await response.json();
    return data.rates[toCurrency];
  } catch (error) {
    console.error(error);
    return 0;
  }
}

app.mount("#app");
