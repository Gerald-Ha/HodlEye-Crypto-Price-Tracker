let allTrades = []; 

document.addEventListener("DOMContentLoaded", () => {
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
    .catch(err => console.error("Fehler beim Laden der Trade Summary", err));
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
      row.innerHTML = `
        <td>${trade.symbol}</td>
        <td>${trade.amount}</td>
        <td>${trade.buyPrice}</td>
        <td>${invest.toFixed(2)}</td>
        <td>${trade.sellPrice}</td>
        <td class="${profitClass}">${trade.profit.toFixed(2)}</td>
        <td class="${profitClass}">${trade.percentProfit.toFixed(2)}%</td>
        <td>${trade.buyDate}</td>
        <td>${trade.sellDate}</td>
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
