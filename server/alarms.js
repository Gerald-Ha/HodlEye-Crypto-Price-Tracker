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
    
    
    const sortedAlarms = data.alarms.sort((a, b) => {
      
      if (a.symbol !== b.symbol) {
        return a.symbol.localeCompare(b.symbol);
      }
      
      return parseFloat(b.price) - parseFloat(a.price);
    });
    
    res.json(sortedAlarms);
  } catch (err) {
    res.status(500).json({ error: "Error reading data" });
  }
});

router.post("/", (req, res) => {
  const { symbol, price, frequency, direction } = req.body;
  if (!symbol || !price) {
    return res.status(400).json({ error: "Symbol and price are required." });
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
    res.status(500).json({ error: "Error writing data" });
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
    res.status(500).json({ error: "Error deleting the alarm" });
  }
});

router.put("/:id", (req, res) => {
  const alarmId = parseInt(req.params.id, 10);
  const updatedAlarm = req.body;
  
  try {
    const data = readData();
    const alarmIndex = data.alarms.findIndex(a => a.id === alarmId);
    
    if (alarmIndex === -1) {
      return res.status(404).json({ error: "Alarm not found" });
    }
    
    data.alarms[alarmIndex] = { ...data.alarms[alarmIndex], ...updatedAlarm };
    writeData(data);
    res.json({ success: true, alarm: data.alarms[alarmIndex] });
  } catch (err) {
    res.status(500).json({ error: "Error updating the alarm" });
  }
});


router.post("/sort", (req, res) => {
  try {
    const data = readData();
    
   
    data.alarms.sort((a, b) => {
      
      if (a.symbol !== b.symbol) {
        return a.symbol.localeCompare(b.symbol);
      }
      
      return parseFloat(b.price) - parseFloat(a.price);
    });
    
    writeData(data);
    res.json({ success: true, message: "Alarms sorted", alarms: data.alarms });
  } catch (err) {
    res.status(500).json({ error: "Error sorting alarms" });
  }
});

module.exports = router;
