const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const session = require("express-session");
require("dotenv").config();
const fetch = require("node-fetch");

/*
 * Metadata
 * Version: 1.5.1
 * Author/Dev: Gerald Hasani
 * Name: HodlEye Crypto Price Tracker
 * Email: contact@gerald-hasani.com
 * GitHub: https://github.com/Gerald-Ha
 */

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "geheim",
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  const publicPaths = ["/login", "/login.html"];
  const staticFileExtensions = [".css", ".js", ".png", ".jpg", ".jpeg", ".svg"];
  if (req.session.loggedIn || publicPaths.includes(req.path) || staticFileExtensions.some(ext => req.path.endsWith(ext))) {
    return next();
  }
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.LOGIN_USER && password === process.env.LOGIN_PASS) {
    req.session.loggedIn = true;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});





const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

const DATA_FILE = path.join(__dirname, "..", "data", "data.json");
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ cryptos: ["BTC"], alarms: [], notifications: [] }, null, 2));
}

const PORTFOLIO_FILE = path.join(__dirname, "..", "data", "portfolio.json");
if (!fs.existsSync(PORTFOLIO_FILE)) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify({ transactions: [] }, null, 2));
}

const TRADE_SUMMARY_FILE = path.join(__dirname, "..", "data", "trade_summary.json");
if (!fs.existsSync(TRADE_SUMMARY_FILE)) {
  fs.writeFileSync(TRADE_SUMMARY_FILE, JSON.stringify({ trades: [] }, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readPortfolio() {
  return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, "utf8"));
}

function writePortfolio(data) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

function readTradeSummary() {
  return JSON.parse(fs.readFileSync(TRADE_SUMMARY_FILE, "utf8"));
}

function writeTradeSummary(data) {
  fs.writeFileSync(TRADE_SUMMARY_FILE, JSON.stringify(data, null, 2));
}

const fsp = fs.promises;

async function readDataAsync() {
  const content = await fsp.readFile(DATA_FILE, "utf8");
  return JSON.parse(content);
}

async function writeDataAsync(data) {
  await fsp.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

async function readPortfolioAsync() {
  const content = await fsp.readFile(PORTFOLIO_FILE, "utf8");
  return JSON.parse(content);
}

async function writePortfolioAsync(data) {
  await fsp.writeFile(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

async function readTradeSummaryAsync() {
  const content = await fsp.readFile(TRADE_SUMMARY_FILE, "utf8");
  return JSON.parse(content);
}

async function writeTradeSummaryAsync(data) {
  await fsp.writeFile(TRADE_SUMMARY_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/update", (req, res) => {
  const remoteUpdateUrl = "https://raw.githubusercontent.com/Gerald-Ha/HodlEye-Crypto-Price-Tracker/refs/heads/main/update.json";
  fetch(remoteUpdateUrl)
    .then(response => response.json())
    .then(data => {
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.header("Pragma", "no-cache");
      res.header("Expires", "0");
      res.json(data);
    })
    .catch(() => {
      res.status(500).json({ error: "Could not fetch update data" });
    });
});

app.get("/api/cryptos", (req, res) => {
  const data = readData();
  res.json(data.cryptos);
});

app.post("/api/cryptos", (req, res) => {
  const { symbol } = req.body;
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required." });
  }
  const data = readData();
  const upperSymbol = symbol.toUpperCase();
  if (!data.cryptos.includes(upperSymbol)) {
    data.cryptos.push(upperSymbol);
    writeData(data);
  }
  res.json(data.cryptos);
});

app.delete("/api/cryptos/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const data = readData();
  data.cryptos = data.cryptos.filter(s => s !== symbol);
  writeData(data);
  res.json({ success: true, cryptos: data.cryptos });
});

app.put("/api/cryptos", (req, res) => {
  const { cryptoList } = req.body;
  if (!Array.isArray(cryptoList)) {
    return res.status(400).json({ error: "cryptoList must be an array." });
  }
  const data = readData();
  data.cryptos = cryptoList;
  writeData(data);
  res.json({ success: true, cryptos: data.cryptos });
});

/* ------------- Notizen  ------------- */

app.post("/api/portfolio/note", (req, res) => {
  const { id, note } = req.body;
  const pf = readPortfolio();
  const tx = pf.transactions.find((x) => String(x.id) === String(id));
  if (!tx) return res.status(400).json({ error: "Invalid ID" });
  tx.note = note;
  writePortfolio(pf);
  res.json({ success: true });
});

app.post("/api/trade_summary/note", (req, res) => {
  const { id, note } = req.body;
  const ts = readTradeSummary();
  const trade = ts.trades.find((x) => String(x.id) === String(id));
  if (!trade) return res.status(400).json({ error: "Invalid ID" });
  trade.note = note;
  writeTradeSummary(ts);
  res.json({ success: true });
});

const alarmsRouter = require("./alarms");
app.use("/api/alarms", alarmsRouter);

app.get("/api/notifications", (req, res) => {
  const data = readData();
  res.json(data.notifications);
});


app.post("/api/portfolio/note", (req, res) => {
  const { id, note } = req.body;
  const pf = readPortfolio();
  const tx = pf.transactions.find(x => String(x.id) === String(id));
  
  if (!tx) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  
  tx.note = note;
  writePortfolio(pf); 
  res.json({ success: true });
});

app.post("/api/trade_summary/note", (req, res) => {
  const { id, note } = req.body;
  const ts = readTradeSummary();
  const trade = ts.trades.find(x => String(x.id) === String(id));
  if (!trade) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  trade.note = note;
  writeTradeSummary(ts);
  res.json({ success: true });
});

app.post("/api/trade_summary/edit", (req, res) => {
  const { id, amount, buyPrice, sellPrice, buyDate, sellDate } = req.body;
  const ts = readTradeSummary();
  const trade = ts.trades.find(x => String(x.id) === String(id));
  if (!trade) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  
  trade.amount = parseFloat(amount);
  trade.buyPrice = parseFloat(buyPrice);
  trade.sellPrice = parseFloat(sellPrice);
  trade.buyDate = buyDate;
  trade.sellDate = sellDate;
  trade.profit = (trade.sellPrice - trade.buyPrice) * trade.amount;
  trade.percentProfit = trade.buyPrice > 0 
    ? (trade.profit / (trade.buyPrice * trade.amount)) * 100 
    : 0;
  
  writeTradeSummary(ts);
  res.json({ success: true });
});

app.post("/api/trade_summary/delete", (req, res) => {
  const { id } = req.body;
  const ts = readTradeSummary();
  const before = ts.trades.length;
  ts.trades = ts.trades.filter(t => String(t.id) !== String(id));
  if (ts.trades.length === before) {
    return res.status(400).json({ error: "No trade with given ID" });
  }
  writeTradeSummary(ts);
  res.json({ success: true });
});

app.post("/api/notifications", (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }
  const data = readData();
  const entry = {
    message,
    timestamp: new Date().toISOString()
  };
  data.notifications.unshift(entry);
  writeData(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(entry));
    }
  });
  res.json(entry);
});

app.delete("/api/notifications", (req, res) => {
  const data = readData();
  data.notifications = [];
  writeData(data);
  res.json({ success: true });
});

async function binanceSupported(sym) {
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`;
  try {
    const r = await fetch(url);
    if (!r.ok) return false;
    const j = await r.json();
    if (j.code) return false;
    return true;
  } catch {
    return false;
  }
}

async function okxSupported(sym) {
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${sym}-USDT`;
  try {
    const r = await fetch(url);
    if (!r.ok) return false;
    const j = await r.json();
    if (!j.data || !j.data[0]) return false;
    return true;
  } catch {
    return false;
  }
}

async function getBinancePrice(sym) {
  const tUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`;
  const r = await fetch(tUrl);
  if (!r.ok) throw new Error("Binance request failed");
  const d = await r.json();
  if (d.code) throw new Error("Binance error code");
  return parseFloat(d.lastPrice);
}

async function getOkxPrice(sym) {
  const url = `https://www.okx.com/api/v5/market/ticker?instId=${sym}-USDT`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("OKX request failed");
  const j = await r.json();
  if (!j.data || !j.data[0]) throw new Error("No OKX data");
  return parseFloat(j.data[0].last);
}

app.get("/api/coinPrice", async (req, res) => {
  const sym = req.query.symbol ? req.query.symbol.toUpperCase() : "";
  if (!sym) return res.status(400).json({ error: "No symbol" });
  let price;
  const binSup = await binanceSupported(sym);
  const okxSup = await okxSupported(sym);
  if (!binSup && !okxSup) {
    return res.status(404).json({ error: "Not supported" });
  }
  if (binSup) {
    try {
      price = await getBinancePrice(sym);
      return res.json({ price });
    } catch {
      if (!okxSup) return res.status(500).json({ error: "Failed fetching price" });
    }
  }
  if (!price && okxSup) {
    try {
      price = await getOkxPrice(sym);
      return res.json({ price });
    } catch {
      return res.status(500).json({ error: "Failed fetching price" });
    }
  }
});

app.get("/api/portfolio", (req, res) => {
  const data = readPortfolio();
  res.json(data);
});

app.post("/api/portfolio/buy", async (req, res) => {
  const { id, symbol, amount, buyPrice, date } = req.body;
  if (!symbol || !amount || !buyPrice) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const upSym = symbol.toUpperCase();
  const binSup = await binanceSupported(upSym);
  const okxSup = await okxSupported(upSym);
  if (!binSup && !okxSup) {
    return res.status(400).json({ error: "Coin not supported" });
  }
  let realPrice;
  if (binSup) {
    try {
      realPrice = await getBinancePrice(upSym);
    } catch {
      realPrice = parseFloat(buyPrice);
    }
  } else if (okxSup) {
    try {
      realPrice = await getOkxPrice(upSym);
    } catch {
      realPrice = parseFloat(buyPrice);
    }
  } else {
    realPrice = parseFloat(buyPrice);
  }
  const pf = readPortfolio();
  const transactionId = id ? String(id) : String(Date.now() + Math.floor(Math.random() * 999999));
  pf.transactions.push({
    id: transactionId,
    symbol: upSym,
    amount: parseFloat(amount),
    buyPrice: parseFloat(buyPrice),
    date: date || new Date().toISOString().split("T")[0],
    currentPrice: realPrice,
    note: "" 
  });
  writePortfolio(pf);
  res.json({ success: true });
});

app.get("/api/portfolio", (req, res) => {
  const data = readPortfolio();
  res.json(data);
});

app.post("/api/portfolio/buy", async (req, res) => {
  const { id, symbol, amount, buyPrice, date } = req.body;
  if (!symbol || !amount || !buyPrice) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const upSym = symbol.toUpperCase();
  const binSup = await binanceSupported(upSym);
  const okxSup = await okxSupported(upSym);
  if (!binSup && !okxSup) {
    return res.status(400).json({ error: "Coin not supported" });
  }
  let realPrice;
  if (binSup) {
    try {
      realPrice = await getBinancePrice(upSym);
    } catch {
      realPrice = parseFloat(buyPrice);
    }
  } else if (okxSup) {
    try {
      realPrice = await getOkxPrice(upSym);
    } catch {
      realPrice = parseFloat(buyPrice);
    }
  } else {
    realPrice = parseFloat(buyPrice);
  }
  const pf = readPortfolio();
  const transactionId = id ? String(id) : String(Date.now() + Math.floor(Math.random() * 999999));
  pf.transactions.push({
    id: transactionId,
    symbol: upSym,
    amount: parseFloat(amount),
    buyPrice: parseFloat(buyPrice),
    date: date || new Date().toISOString().split("T")[0],
    currentPrice: realPrice
  });
  writePortfolio(pf);
  res.json({ success: true });
});


app.get("/api/portfolio/prices", async (req, res) => {
  const pf = readPortfolio();
  let result = [];
  let changed = false;

  for (let t of pf.transactions) {
    if (!t.id) {
      t.id = String(Date.now() + Math.floor(Math.random() * 999999));
      changed = true;
    } else {
      t.id = String(t.id);
    }

    try {
      const binSup = await binanceSupported(t.symbol);
      const okxSup = await okxSupported(t.symbol);
      if (binSup) t.currentPrice = await getBinancePrice(t.symbol);
      else if (okxSup) t.currentPrice = await getOkxPrice(t.symbol);
    } catch {
      
    }

   
    result.push({
      id: t.id,
      symbol: t.symbol,
      amount: t.amount,
      buyPrice: t.buyPrice,
      date: t.date,
      currentPrice: t.currentPrice,
      note: t.note, 
    });
  }

  if (changed) writePortfolio(pf);
  res.json(result);
});

app.post("/api/portfolio/edit", (req, res) => {
  const { id, newAmount, newBuyPrice, newDate } = req.body;
  const pf = readPortfolio();
  let tx = pf.transactions.find(x => String(x.id) === String(id));
  if (!tx) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  tx.amount = parseFloat(newAmount);
  tx.buyPrice = parseFloat(newBuyPrice);
  tx.date = newDate;
  writePortfolio(pf);
  res.json({ success: true });
});

app.get("/api/trade_summary", (req, res) => {
  const data = readTradeSummary();
  data.trades.sort((a, b) => new Date(b.sellDate) - new Date(a.sellDate));
  res.json(data.trades);
});

app.post("/api/portfolio/sell", (req, res) => {
  const { id, sellAmount, sellPrice, sellDate } = req.body;
  if (!id || isNaN(sellAmount) || isNaN(sellPrice) || !sellDate) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }
  const pf = readPortfolio();
  let txIndex = pf.transactions.findIndex(x => String(x.id) === String(id));
  if (txIndex === -1) {
    return res.status(400).json({ error: "Transaktion nicht gefunden" });
  }
  let tx = pf.transactions[txIndex];
  if (sellAmount > tx.amount) {
    return res.status(400).json({ error: "Verkaufsmenge überschreitet die vorhandene Menge" });
  }
  const profit = (parseFloat(sellPrice) - parseFloat(tx.buyPrice)) * sellAmount;
  const percentProfit = tx.buyPrice > 0 ? (profit / (tx.buyPrice * sellAmount)) * 100 : 0;
  const tradeEntry = {
    id: Date.now(),
    symbol: tx.symbol,
    amount: sellAmount,
    buyPrice: tx.buyPrice,
    sellPrice: parseFloat(sellPrice),
    profit: profit,
    percentProfit: percentProfit,
    buyDate: tx.date,
    sellDate: sellDate,
    note: tx.note || "" 
  };
  if (sellAmount < tx.amount) {
    tx.amount = tx.amount - sellAmount;
  } else {
    pf.transactions.splice(txIndex, 1);
  }
  writePortfolio(pf);
  const tsData = readTradeSummary();
  tsData.trades.push(tradeEntry);
  writeTradeSummary(tsData);
  res.json({ success: true, trade: tradeEntry });
});

app.post("/api/portfolio/delete", (req, res) => {
  const { id } = req.body;
  const pf = readPortfolio();
  const before = pf.transactions.length;
  pf.transactions = pf.transactions.filter(t => String(t.id) !== String(id));
  if (pf.transactions.length === before) {
    return res.status(400).json({ error: "No transaction with given ID" });
  }
  writePortfolio(pf);
  res.json({ success: true });
});

app.post("/api/portfolio/sell", (req, res) => {
  const { id, sellAmount, sellPrice, sellDate } = req.body;
  if (!id || isNaN(sellAmount) || isNaN(sellPrice) || !sellDate) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }
  const pf = readPortfolio();
  let txIndex = pf.transactions.findIndex(x => String(x.id) === String(id));
  if (txIndex === -1) {
    return res.status(400).json({ error: "Transaktion nicht gefunden" });
  }
  let tx = pf.transactions[txIndex];
  if (sellAmount > tx.amount) {
    return res.status(400).json({ error: "Verkaufsmenge überschreitet die vorhandene Menge" });
  }
  const profit = (parseFloat(sellPrice) - parseFloat(tx.buyPrice)) * sellAmount;
  const percentProfit = tx.buyPrice > 0 ? (profit / (tx.buyPrice * sellAmount)) * 100 : 0;
  const tradeEntry = {
    id: Date.now(),
    symbol: tx.symbol,
    amount: sellAmount,
    buyPrice: tx.buyPrice,
    sellPrice: parseFloat(sellPrice),
    profit: profit,
    percentProfit: percentProfit,
    buyDate: tx.date,
    sellDate: sellDate
  };
  if (sellAmount < tx.amount) {
    tx.amount = tx.amount - sellAmount;
  } else {
    pf.transactions.splice(txIndex, 1);
  }
  writePortfolio(pf);
  const tsData = readTradeSummary();
  tsData.trades.push(tradeEntry);
  writeTradeSummary(tsData);
  res.json({ success: true, trade: tradeEntry });
});

app.get("/api/trade_summary", (req, res) => {
  const data = readTradeSummary();
  data.trades.sort((a, b) => new Date(b.sellDate) - new Date(a.sellDate));
  res.json(data.trades);
});

app.use(express.static(path.join(__dirname, "..", "public")));

function readTradeSummary() {
  try {
    const content = fs.readFileSync(TRADE_SUMMARY_FILE, "utf8");
    const data = JSON.parse(content);
    
    if (data.trades) {
      data.trades.forEach(trade => {
        if (!trade.hasOwnProperty('note')) {
          trade.note = "";
        }
      });
    }
    return data;
  } catch (err) {
    console.error("Error reading trade summary:", err);
    return { trades: [] };
  }
}

function writeTradeSummary(data) {
  try {
    fs.writeFileSync(TRADE_SUMMARY_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing trade summary:", err);
  }
}

function readPortfolio() {
  try {
    const content = fs.readFileSync(PORTFOLIO_FILE, "utf8");
    const data = JSON.parse(content);
    
    if (data.transactions) {
      data.transactions.forEach(tx => {
        if (!tx.hasOwnProperty('note')) {
          tx.note = "";
        }
      });
    }
    return data;
  } catch (err) {
    console.error("Error reading portfolio:", err);
    return { transactions: [] };
  }
}

function writePortfolio(data) {
  try {
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing portfolio:", err);
  }
}


wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3099;
server.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
