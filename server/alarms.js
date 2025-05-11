const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_FILE = path.join(__dirname, "..", "data", "data.json");

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

router.get("/", (req, res) => {
  try {
    const data = readData();
    res.json(data.alarms);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Lesen der Daten" });
  }
});

router.post("/", (req, res) => {
  const { symbol, price, frequency, direction } = req.body;
  if (!symbol || !price) {
    return res.status(400).json({ error: "Symbol und Preis sind erforderlich." });
  }
  try {
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
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Schreiben der Daten" });
  }
});

router.delete("/:id", (req, res) => {
  const alarmId = parseInt(req.params.id, 10);
  try {
    const data = readData();
    data.alarms = data.alarms.filter(a => a.id !== alarmId);
    writeData(data);
    res.json({ success: true, alarms: data.alarms });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen des Alarms" });
  }
});

module.exports = router;
