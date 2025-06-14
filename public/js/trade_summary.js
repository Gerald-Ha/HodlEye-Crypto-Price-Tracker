let allTrades = [];
let editTradeId = null;
let currentNoteId = null;
let currentNoteType = null;

document.addEventListener("DOMContentLoaded", () => {
  noteModal = document.getElementById("noteModal");
  window.addEventListener("click", (event) => {
    if (event.target === noteModal) closeNoteModal();
  });
  loadTradeSummary();
});

function loadTradeSummary() {
  fetch("/api/trade_summary", { credentials: "include" })
    .then(r => r.json())
    .then(trades => {
      allTrades = trades;
      renderTradeSummary(allTrades);
      updateBottomBar(allTrades);
    })
    .catch(err => console.error("Error loading trade summary", err));
}

function renderTradeSummary(trades) {
  const container = document.getElementById("tradeSummaryContainer");
  container.innerHTML = "";
  
  let grouped = {};
  trades.forEach(trade => {
    if (!grouped[trade.symbol]) {
      grouped[trade.symbol] = [];
    }
    grouped[trade.symbol].push(trade);
  });

  for (let symbol in grouped) {
    let section = document.createElement("div");
    section.className = "coin-section";

    let heading = document.createElement("h2");
    heading.textContent = symbol;
    section.appendChild(heading);

    let table = document.createElement("table");
    let thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Symbol</th>
        <th>Amount</th>
        <th>Buy Price</th>
        <th>Invest</th>
        <th>Sell Price</th>
        <th>Profit</th>
        <th>% Profit</th>
        <th>Buy Date</th>
        <th>Sell Date</th>
      </tr>
    `;
    table.appendChild(thead);

    let tbody = document.createElement("tbody");

    grouped[symbol].sort((a, b) => new Date(b.sellDate) - new Date(a.sellDate));

    let totalProfit = 0;
    let totalBuyCost = 0;   
    let totalSellValue = 0; 
    let totalAmount = 0;

    grouped[symbol].forEach(trade => {
      let row = document.createElement("tr");
      let profitClass = trade.profit >= 0 ? "positive" : "negative";
      let invest = trade.buyPrice * trade.amount;
      const editButton = `<span class="edit-button" onclick="openEditTradeModal('${trade.id}')">✎</span>`;
      const noteButton = `<span class="note-button ${trade.note ? 'has-note' : 'no-note'}" onclick="openNoteModal('${trade.id}', 'trade')">✉</span>`;
      
      row.innerHTML = `
        <td>${trade.symbol}</td>
        <td>${trade.amount}</td>
        <td>${trade.buyPrice}</td>
        <td>${invest.toFixed(2)}</td>
        <td>${trade.sellPrice}</td>
        <td class="${profitClass}">${trade.profit.toFixed(2)}</td>
        <td class="${profitClass}">${trade.percentProfit.toFixed(2)}%</td>
        <td>${trade.buyDate}</td>
        <td>${trade.sellDate}${editButton}${noteButton}</td>
      `;
      tbody.appendChild(row);

      totalProfit += trade.profit;
      totalAmount += trade.amount;
      totalBuyCost += invest;
      totalSellValue += trade.sellPrice * trade.amount;
    });

    let totalPctProfit = 0;
    if (totalBuyCost > 0) {
      totalPctProfit = ((totalSellValue - totalBuyCost) / totalBuyCost) * 100;
    }

    let summaryRow = document.createElement("tr");
    summaryRow.className = "summary-row";
    let summaryProfitClass = totalProfit >= 0 ? "positive" : "negative";
    summaryRow.innerHTML = `
      <td>${symbol} (Total)</td>
      <td>${totalAmount}</td>
      <td>-</td>
      <td>${totalBuyCost.toFixed(2)}</td>
      <td>-</td>
      <td class="${summaryProfitClass}">${totalProfit.toFixed(2)}</td>
      <td class="${summaryProfitClass}">${totalPctProfit.toFixed(2)}%</td>
      <td>-</td>
      <td>-</td>
    `;
    tbody.appendChild(summaryRow);

    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  }
}

function updateBottomBar(trades) {
  let totalProfit = 0;
  let totalBuyCost = 0;
  let totalSellValue = 0;

  trades.forEach(tr => {
    totalProfit += tr.profit;
    totalBuyCost += tr.buyPrice * tr.amount;
    totalSellValue += tr.sellPrice * tr.amount;
  });

  let pctChange = 0;
  if (totalBuyCost > 0) {
    pctChange = ((totalSellValue - totalBuyCost) / totalBuyCost) * 100;
  }

  document.getElementById("totalTradeInvest").textContent = totalBuyCost.toFixed(2) + " USDT";
  document.getElementById("totalTradeProfit").textContent = totalProfit.toFixed(2) + " USDT";
  document.getElementById("totalTradePercentChange").textContent = pctChange.toFixed(2) + "%";
}


function openNoteModal(id, type) {
  currentNoteId = id;
  currentNoteType = type;
  document.getElementById("noteModal").style.display = "block";
  
  const trade = allTrades.find(x => String(x.id) === String(id));
  document.getElementById("noteText").value = trade?.note || "";
}

function closeNoteModal() {
  document.getElementById("noteModal").style.display = "none";
}

function saveNote() {
  const noteText = document.getElementById("noteText").value;
  
  fetch("/api/trade_summary/note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      id: currentNoteId, 
      note: noteText 
    }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      closeNoteModal();
      loadTradeSummary();
    }
  })
  .catch(() => alert("Error saving note"));
}


function openEditTradeModal(id) {
  editTradeId = id;
  const trade = allTrades.find(t => String(t.id) === String(id));
  if (!trade) {
    alert("Invalid trade");
    return;
  }
  
  document.getElementById("editTradeAmount").value = trade.amount;
  document.getElementById("editTradeBuyPrice").value = trade.buyPrice;
  document.getElementById("editTradeSellPrice").value = trade.sellPrice;
  document.getElementById("editTradeBuyDate").value = trade.buyDate;
  document.getElementById("editTradeSellDate").value = trade.sellDate;
  
  document.getElementById("editTradeModal").style.display = "block";
}

function closeEditTradeModal() {
  document.getElementById("editTradeModal").style.display = "none";
}

function saveEditedTrade() {
  const trade = allTrades.find(t => String(t.id) === String(editTradeId));
  if (!trade) {
    alert("Invalid trade");
    return;
  }
  
  const amount = parseFloat(document.getElementById("editTradeAmount").value);
  const buyPrice = parseFloat(document.getElementById("editTradeBuyPrice").value);
  const sellPrice = parseFloat(document.getElementById("editTradeSellPrice").value);
  const buyDate = document.getElementById("editTradeBuyDate").value;
  const sellDate = document.getElementById("editTradeSellDate").value;
  
  if (isNaN(amount) || isNaN(buyPrice) || isNaN(sellPrice)) {
    alert("Please enter valid values");
    return;
  }
  
  fetch("/api/trade_summary/edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: editTradeId,
      amount,
      buyPrice,
      sellPrice,
      buyDate,
      sellDate
    }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      closeEditTradeModal();
      loadTradeSummary();
    }
  })
  .catch(() => alert("Error saving trade"));
}

function deleteTrade() {
  openDeleteTradeConfirmationModal();
}

function openDeleteTradeConfirmationModal() {
  document.getElementById("deleteTradeConfirmationModal").style.display = "block";
}

function closeDeleteTradeConfirmationModal() {
  document.getElementById("deleteTradeConfirmationModal").style.display = "none";
}

function confirmDeleteTrade() {
  fetch("/api/trade_summary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: editTradeId }),
    credentials: "include"
  })
  .then(r => r.json())
  .then(j => {
    if (j.error) {
      alert(j.error);
    } else {
      closeDeleteTradeConfirmationModal();
      closeEditTradeModal();
      loadTradeSummary();
    }
  })
  .catch(() => alert("Error deleting trade"));
}


function openDateFilterModal() {
  document.getElementById("dateFilterModal").style.display = "block";
}

function closeDateFilterModal() {
  document.getElementById("dateFilterModal").style.display = "none";
}

function applyDateFilter() {
  const radios = document.getElementsByName("dateFilterType");
  let filterType = "all";
  for (let r of radios) {
    if (r.checked) {
      filterType = r.value;
      break;
    }
  }

  if (filterType === "all") {
    renderTradeSummary(allTrades);
    updateBottomBar(allTrades);
    closeDateFilterModal();
    return;
  }

  const fromDateValue = document.getElementById("filterFromDate").value; 
  const toDateValue = document.getElementById("filterToDate").value;     

  let filtered = allTrades.filter(tr => {
    let sd = new Date(tr.sellDate); 
    if (fromDateValue) {
      let from = new Date(fromDateValue);
      if (sd < from) return false;
    }
    if (toDateValue) {
      let to = new Date(toDateValue);
      to.setHours(23,59,59,999);
      if (sd > to) return false;
    }
    return true;
  });

  renderTradeSummary(filtered);
  updateBottomBar(filtered);
  closeDateFilterModal();
}