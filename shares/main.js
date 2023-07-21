const app = Vue.createApp({
  data() {
    return {
      data: []
    };
  },
  async mounted() {
    const response = await fetch("data.json");
    const data = await response.json();
    const exchangeRate = await getExchangeRate("USD", "RUB");

    for (const item of data) {
      if (item.shares) {
        const stockData = await getStockData(item.shares.label);
        let currentPrice = stockData.marketdata.data[0][11];
        if (item.shares.currency === "USD") {
          currentPrice = currentPrice / exchangeRate;
        }
        this.data.push({
          label: item.shares.label,
          book_value: item.shares.book_value,
          current_price: currentPrice.toFixed(2),
          change:
            (
              ((currentPrice - item.shares.book_value) /
                item.shares.book_value) *
              100
            ).toFixed(2) + "%",
          currency: item.shares.currency
        });
      } else if (item.crypto) {
        let cryptoPrice = await getCryptoPrice(item.crypto.label);
        if (item.crypto.currency === "RUB") {
          cryptoPrice = cryptoPrice * exchangeRate;
        }
        this.data.push({
          label: item.crypto.label,
          book_value: item.crypto.book_value,
          current_price: cryptoPrice.toFixed(2),
          change:
            (
              ((cryptoPrice - item.crypto.book_value) /
                item.crypto.book_value) *
              100
            ).toFixed(2) + "%",
          currency: item.crypto.currency
        });
      }
    }
  }
});

async function getStockData(ticker) {
  const response = await fetch(
    `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${ticker}.json`
  );
  const data = await response.json();
  return data;
}

async function getCryptoPrice(symbol) {
  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
  );
  const data = await response.json();
  return parseFloat(data.price);
}

async function getExchangeRate(fromCurrency, toCurrency) {
  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
  );
  const data = await response.json();
  return data.rates[toCurrency];
}

app.mount("#app");
