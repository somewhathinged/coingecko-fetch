import fetch from "node-fetch";
import * as fs from "fs";

const SUPPLY_VAR = "circulating_supply";
const CONFIG = JSON.parse(fs.readFileSync("config.json"));
const API_KEY = CONFIG.key;

const fetchBTCPrice = async () => {
  let response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&apikey=${API_KEY}`
  );
  let json = await response.json();
  return json.bitcoin.usd;
};

const fetchMarkets = async (page) => {
  let response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=BTC&page=${page}&per_page=250&apikey=${API_KEY}`
  );
  return response.json();
};

const fetchCoinMarket = async (coin) => {
  let response = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=BTC&ids=${coin}&apikey=${API_KEY}`
  );
  return response.json();
};

const jsonToMD = (json) => {
  let tableString = "|";
  Object.keys(json[0]).forEach((key) => (tableString += ` ${key} |`));
  tableString += "\n|";
  Object.keys(json[0]).forEach((key) => (tableString += ` --- |`));
  json.forEach((coin) => {
    tableString += "\n|";
    Object.values(coin).forEach((value) => (tableString += ` ${value} |`));
  });
  return tableString;
};

(async () => {
  let btcPrice = await fetchBTCPrice();
  let result = await Promise.all([fetchMarkets(1), fetchMarkets(2)]).then(
    (response) =>
      response
        .flat()
        .filter(
          (coin) =>
            coin.market_cap > 4000 &&
            coin.market_cap < 50000 &&
            coin[SUPPLY_VAR] > 1000000 &&
            coin[SUPPLY_VAR] < 1000000000000 &&
            coin.ath * coin[SUPPLY_VAR] < 200000 &&
            coin.ath_change_percentage > -90
        )
        .map((coin) => {
          return {
            name: coin.name,
            // market_cap_usd: new Intl.NumberFormat().format(
            //   (coin.current_price * btcPrice * coin[SUPPLY_VAR]).toFixed(0)
            // ),
            market_cap: coin.market_cap,
            // circ_supply: new Intl.NumberFormat().format(
            //   coin[SUPPLY_VAR].toFixed(0)
            // ),
            ath_change: coin.ath_change_percentage.toFixed(2),
          };
        })
  );

  let table = jsonToMD(result);
  fs.writeFileSync("result.md", table);
})();
