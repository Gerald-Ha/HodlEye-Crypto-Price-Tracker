let portfolioData = [];
let coinColors = {};
let addTransactionModal, editTransactionModal, colorConfigModal;
let buyForm, sellForm;
let portfolioList, pieChartCanvas, chartLegend;
let editIdGlobal = null;

document.addEventListener("DOMContentLoaded", () => {
  addTransactionModal = document.getElementById("addTransactionModal");
  editTransactionModal = document.getElementById("editTransactionModal");
  colorConfigModal = document.getElementById("colorConfigModal");
  buyForm = document.getElementById("buyForm");
  sellForm = document.getElementById("sellForm");
  portfolioList = document.getElementById("portfolioList");
  pieChartCanvas = document.getElementById("portfolioPieChart");
  chartLegend = document.getElementById("chartLegend");
  window.addEventListener("click", (event) => {
    if (event.target === addTransactionModal) closeAddTransactionModal();
    if (event.target === editTransactionModal) closeEditTransactionModal();
    if (event.target === colorConfigModal) closeColorConfigModal();
  });
  loadCoinColorsFromStorage();
  loadPortfolioData();
  setInterval(() => {
    updatePrices();
  }, 10000);
});

function loadPortfolioData() {
  fetch("/api/portfolio", { credentials: "include" })
    .then(r => r.json())
    .then(d => {
      portfolioData = d.transactions || [];
      updatePrices();
    });
}

function updatePrices() {
  fetch("/api/portfolio/prices", { credentials: "include" })
    .then(r => r.json())
    .then(arr => {
      portfolioData = arr.map(x => {
        x.id = String(x.id);
        return x;
      });
      renderPortfolio();
      drawPieChart();
    });
}

function renderPortfolio() {
  portfolioList.innerHTML = "";
  let grouped = {};
  portfolioData.forEach(t => {
    if (!grouped[t.symbol]) grouped[t.symbol] = [];
    grouped[t.symbol].push(t);
  });
  for (let sym in grouped) {
    const section = document.createElement("div");
    section.className = "coin-section";
    const heading = document.createElement("h2");
    heading.textContent = sym;
    section.appendChild(heading);
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Symbol</th>
        <th>Amount</th>
        <th>Buy Price</th>
        <th>Current</th>
        <th>Invest</th>
        <th>Profit / Loss</th>
        <th>% Change</th>
        <th>Buy Date</th>
      </tr>
    `;
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    let totalAmount = 0;
    let totalCost = 0;
    grouped[sym].forEach(tx => {
      const currentTotal = tx.amount * tx.currentPrice;
      const initialTotal = tx.amount * tx.buyPrice;
      const diff = currentTotal - initialTotal;
      const pct = initialTotal === 0 ? 0 : (diff / initialTotal) * 100;
      totalAmount += tx.amount;
      totalCost += initialTotal;
      const row = document.createElement("tr");
      const diffClass = diff >= 0 ? "positive" : "negative";
      const editButton = `<span class="edit-button" onclick="openEditTransactionModal('${tx.id}')">✎</span>`;
      row.innerHTML = `
        <td>${tx.symbol}</td>
        <td>${tx.amount}</td>
        <td>${tx.buyPrice}</td>
        <td>${tx.currentPrice.toFixed(2)}</td>
        <td>${(tx.amount * tx.buyPrice).toFixed(2)}</td>
        <td class="${diffClass}">${diff.toFixed(2)}</td>
        <td class="${diffClass}">${pct.toFixed(2)}%</td>
        <td>${tx.date}${editButton}</td>
      `;
      tbody.appendChild(row);
    });
    const totalCurrent = totalAmount * (grouped[sym][0].currentPrice || 0);
    const totalDiff = totalCurrent - totalCost;
    const totalPct = totalCost === 0 ? 0 : (totalDiff / totalCost) * 100;
    const avgBuyPrice = totalAmount === 0 ? 0 : totalCost / totalAmount;
    const totalRow = document.createElement("tr");
    totalRow.className = "summary-row";
    const summaryClass = totalDiff >= 0 ? "positive" : "negative";
    totalRow.innerHTML = `
      <td>${sym} (Total)</td>
      <td>${totalAmount.toFixed(6)}</td>
      <td>Ø ${avgBuyPrice.toFixed(2)}</td>
      <td>${(grouped[sym][0].currentPrice || 0).toFixed(2)}</td>
      <td>${totalCost.toFixed(2)}</td>
      <td class="${summaryClass}">${totalDiff.toFixed(2)}</td>
      <td class="${summaryClass}">${totalPct.toFixed(2)}%</td>
      <td>-</td>
    `;
    tbody.appendChild(totalRow);
    table.appendChild(tbody);
    section.appendChild(table);
    portfolioList.appendChild(section);
  }
  calculateTotals();
}

function calculateTotals() {
  let grandCost = 0;
  let grandValue = 0;
  portfolioData.forEach(t => {
    grandCost += t.buyPrice * t.amount;
    grandValue += t.currentPrice * t.amount;
  });
  const diff = grandValue - grandCost;
  const pct = grandCost === 0 ? 0 : (diff / grandCost) * 100;
  document.getElementById("totalInvest").textContent = grandCost.toFixed(2) + " USDT";
  document.getElementById("totalProfitLoss").textContent = diff.toFixed(2) + " USDT";
  document.getElementById("totalPercentChange").textContent = pct.toFixed(2) + "%";
}

function drawPieChart() {
  if (!pieChartCanvas) return;
  let grouped = {};
  portfolioData.forEach(t => {
    if (!grouped[t.symbol]) grouped[t.symbol] = 0;
    grouped[t.symbol] += t.currentPrice * t.amount;
  });
  let totalAll = 0;
  let coinValues = [];
  for (let s in grouped) {
    totalAll += grouped[s];
  }
  for (let s in grouped) {
    coinValues.push({ symbol: s, value: grouped[s] });
  }
  const ctx = pieChartCanvas.getContext("2d");
  ctx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
  const centerX = pieChartCanvas.width / 2;
  const centerY = pieChartCanvas.height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  let startAngle = 0;
  coinValues.forEach(item => {
    const sliceAngle = totalAll === 0 ? 0 : (item.value / totalAll) * 2 * Math.PI;
    if (!coinColors[item.symbol]) {
      coinColors[item.symbol] = randomColor();
    }
    ctx.fillStyle = coinColors[item.symbol];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    startAngle += sliceAngle;
  });
  renderChartLegend(coinValues, totalAll);
}

function renderChartLegend(coinValues, totalAll) {
  chartLegend.innerHTML = "";
  coinValues.forEach(item => {
    const percent = totalAll === 0 ? 0 : (item.value / totalAll) * 100;
    const div = document.createElement("div");
    const colorBox = document.createElement("span");
    colorBox.className = "legend-color-box";
    colorBox.style.backgroundColor = coinColors[item.symbol];
    div.appendChild(colorBox);
    div.appendChild(document.createTextNode(item.symbol + " - " + percent.toFixed(2) + "%"));
    chartLegend.appendChild(div);
  });
}

function openAddTransactionModal() {
  addTransactionModal.style.display = "block";
  showBuyForm();
}

function closeAddTransactionModal() {
  addTransactionModal.style.display = "none";
}

function showBuyForm() {
  buyForm.style.display = "block";
  sellForm.style.display = "none";
}

function showSellForm() {
  buyForm.style.display = "none";
  sellForm.style.display = "block";
  populateSellDropdown();
}

function confirmBuy() {
  const symbol = document.getElementById("buySymbol").value.trim().toUpperCase();
  const amount = parseFloat(document.getElementById("buyAmount").value);
  const buyPrice = parseFloat(document.getElementById("buyPrice").value);
  const buyDate = document.getElementById("buyDate").value;
  if (!symbol || isNaN(amount) || isNaN(buyPrice)) {
    alert("Bitte gültige Werte eingeben");
    return;
  }
  const newId = Date.now() + Math.floor(Math.random() * 999999);
  fetch("/api/coinPrice?symbol=" + symbol, { credentials: "include" })
    .then(r => r.json())
    .then(j => {
      if (j.error) {
        alert("Dieser Coin wird nicht unterstützt");
      } else {
        fetch("/api/portfolio/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newId,
            symbol,
            amount,
            buyPrice,
            date: buyDate
          }),
          credentials: "include"
        })
        .then(rr => rr.json())
        .then(result => {
          if (result.error) {
            alert(result.error);
          } else {
            updatePrices();
            closeAddTransactionModal();
          }
        });
      }
    })
    .catch(() => alert("Netzwerkfehler"));
}

function confirmSell() {
  const sel = document.getElementById("sellSelectTransaction");
  const val = sel.value;
  if (!val) return;
  const sellAmount = parseFloat(document.getElementById("sellAmount").value);
  const sellPrice = parseFloat(document.getElementById("sellPrice").value);
  const sellDate = document.getElementById("sellDate").value;
  if (isNaN(sellAmount) || isNaN(sellPrice) || !sellDate) {
    alert("Bitte gültige Werte eingeben");
    return;
  }
  const parts = val.split("|");
  const sym = parts[0];
  const idx = parseInt(parts[1], 10);
  let selectedTransaction = null;
  let count = 0;
  for (let i = 0; i < portfolioData.length; i++) {
    if (portfolioData[i].symbol === sym) {
      if (count === idx) {
        selectedTransaction = portfolioData[i];
        break;
      }
      count++;
    }
  }
  if (!selectedTransaction) {
    alert("Ungültig");
    return;
  }
  
  fetch("/api/portfolio/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: selectedTransaction.id,
      sellAmount: sellAmount,
      sellPrice: sellPrice,
      sellDate: sellDate
    }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      updatePrices();
      closeAddTransactionModal();
    }
  })
  .catch(() => alert("Fehler beim Sell"));
}

function populateSellDropdown() {
  const sel = document.getElementById("sellSelectTransaction");
  sel.innerHTML = "";
  let grouped = {};
  portfolioData.forEach(t => {
    if (!grouped[t.symbol]) grouped[t.symbol] = [];
    grouped[t.symbol].push(t);
  });
  for (let sym in grouped) {
    grouped[sym].forEach((tx, i) => {
      const opt = document.createElement("option");
      opt.value = sym + "|" + i;
      opt.text = sym + " - " + tx.amount + "@" + tx.buyPrice + " (" + tx.date + ")";
      sel.appendChild(opt);
    });
  }
}

function openEditTransactionModal(id) {
  editTransactionModal.style.display = "block";
  editIdGlobal = id;
  let t = portfolioData.find(x => String(x.id) === String(id));
  if (!t) {
    alert("Keine gültige Transaktion gefunden");
    return;
  }
  document.getElementById("editSymbol").value = t.symbol;
  document.getElementById("editAmount").value = t.amount;
  document.getElementById("editBuyPrice").value = t.buyPrice;
  document.getElementById("editDate").value = t.date;
}

function closeEditTransactionModal() {
  editTransactionModal.style.display = "none";
}

function saveEditedTransaction() {
  let t = portfolioData.find(x => String(x.id) === String(editIdGlobal));
  if (!t) {
    alert("Keine gültige Transaktion gefunden");
    return;
  }
  const newAmount = parseFloat(document.getElementById("editAmount").value);
  const newBuyPrice = parseFloat(document.getElementById("editBuyPrice").value);
  const newDate = document.getElementById("editDate").value;
  if (isNaN(newAmount) || isNaN(newBuyPrice)) {
    alert("Bitte gültige Werte eingeben");
    return;
  }
  fetch("/api/portfolio/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: t.id,
      symbol: t.symbol,
      newAmount,
      newBuyPrice,
      newDate
    }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      closeEditTransactionModal();
      updatePrices();
    }
  })
  .catch(() => alert("Fehler bei Edit"));
}

function deleteTransaction() {
  let t = portfolioData.find(x => String(x.id) === String(editIdGlobal));
  if (!t) {
    alert("Keine gültige Transaktion gefunden");
    return;
  }
  fetch("/api/portfolio/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: t.id, symbol: t.symbol }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      closeEditTransactionModal();
      updatePrices();
    }
  })
  .catch(() => alert("Fehler bei Delete"));
}

function openColorConfigModal() {
  colorConfigModal.style.display = "block";
  renderColorConfigList();
}

function closeColorConfigModal() {
  colorConfigModal.style.display = "none";
}

function renderColorConfigList() {
  const container = document.getElementById("colorConfigList");
  container.innerHTML = "";
  let syms = {};
  portfolioData.forEach(t => { syms[t.symbol] = true; });
  Object.keys(syms).forEach(s => {
    const div = document.createElement("div");
    div.style.marginBottom = "0.5rem";
    const label = document.createElement("label");
    label.textContent = s + ": ";
    div.appendChild(label);
    const input = document.createElement("input");
    input.type = "color";
    if (!coinColors[s]) {
      coinColors[s] = randomColor();
    }
    input.value = rgbToHex(coinColors[s]);
    input.addEventListener("input", () => {
      coinColors[s] = input.value;
    });
    div.appendChild(input);
    container.appendChild(div);
  });
}

function saveColorConfig() {
  closeColorConfigModal();
  saveCoinColorsToStorage();
  drawPieChart();
}

function randomColor() {
  const r = Math.floor(Math.random() * 200 + 55);
  const g = Math.floor(Math.random() * 200 + 55);
  const b = Math.floor(Math.random() * 200 + 55);
  return `rgb(${r},${g},${b})`;
}

function rgbToHex(str) {
  if (str.indexOf("#") === 0) return str;
  const p = str.replace(/[^\d,]/g, "").split(",");
  const r = parseInt(p[0], 10);
  const g = parseInt(p[1], 10);
  const b = parseInt(p[2], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function loadCoinColorsFromStorage() {
  const s = localStorage.getItem("coinColors");
  if (s) coinColors = JSON.parse(s);
}

function saveCoinColorsToStorage() {
  localStorage.setItem("coinColors", JSON.stringify(coinColors));
}
