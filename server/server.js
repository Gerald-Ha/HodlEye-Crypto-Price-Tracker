const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

/*
 * Metadata
 * Version: 1.0.5
 * Author/Dev: Gerald Hasani
 * Name: HodlEye Crypto Price Tracker
 * Email: contact@gerald-hasani.com
 * GitHub: https://github.com/Gerald-Ha
 */

const DATA_FILE = path.join(__dirname, "..", "data", "data.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    cryptos: ["BTC"], 
    alarms: [],
    notifications: []
  }, null, 2));
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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

app.get("/api/alarms", (req, res) => {
  const data = readData();
  res.json(data.alarms);
});

app.post("/api/alarms", (req, res) => {
  const { symbol, price, frequency, direction } = req.body;
  if (!symbol || !price) {
    return res.status(400).json({ error: "symbol and price are required." });
  }

  const data = readData();
  const newAlarm = {
    id: Date.now(),
    symbol: symbol.toUpperCase(),
    price: parseFloat(price),
    frequency: frequency || "Once",
    direction: direction || "Rising",
    triggered: false
  };
  data.alarms.push(newAlarm);
  writeData(data);
  res.json(newAlarm);
});

app.delete("/api/alarms/:id", (req, res) => {
  const alarmId = parseInt(req.params.id, 10);
  const data = readData();
  data.alarms = data.alarms.filter(a => a.id !== alarmId);
  writeData(data);
  res.json({ success: true, alarms: data.alarms });
});

app.get("/api/notifications", (req, res) => {
  const data = readData();
  res.json(data.notifications);
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

  // Nachricht an alle WebSocket-Clients senden
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

app.use(express.static(path.join(__dirname, "..", "public")));

// WebSocket-Server für Echtzeitbenachrichtigungen
wss.on("connection", (ws) => {
    console.log("Client verbunden");
    clients.add(ws);

    ws.on("close", () => {
        console.log("Client getrennt");
        clients.delete(ws);
    });
});

// Server starten
const PORT = process.env.PORT || 3099;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
