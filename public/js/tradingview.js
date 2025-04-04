function openTradingViewModal(exchange, symbol) {
    const tradingViewSymbol = `${exchange}:${symbol}USDT`;
    console.log("TradingView-Symbol =", tradingViewSymbol);

    const modal = document.getElementById("tradingViewModal");
    const container = document.getElementById("tradingViewModalContent");

    
    modal.style.display = "block";

    
    container.innerHTML = `
      <span class="close" onclick="closeTradingViewModal()">&times;</span>
      <div class="tradingview-widget-container" style="height:700px; width:100%;">
        <div class="tradingview-widget-container__widget" style="height:calc(700px - 32px); width:100%;"></div>
        <div class="tradingview-widget-copyright">
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span class="blue-text">Track all markets on TradingView</span>
          </a>
        </div>
      </div>
    `;

    
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;

    script.text = JSON.stringify({
        "autosize": true,
        "symbol": tradingViewSymbol,
        "interval": "1H",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "hide_side_toolbar": false,
        "style": "1",
        "locale": "en",
        "allow_symbol_change": true,
        "calendar": false,
        "support_host": "https://www.tradingview.com"
    });

    
    const widgetContainer = container.querySelector(".tradingview-widget-container");
    if (widgetContainer) {
        widgetContainer.appendChild(script);
        console.log("TradingView-Widget-Skript korrekt dem Container hinzugefügt.");
    } else {
        console.error("Fehler: Widget-Container nicht gefunden.");
    }
}


function closeTradingViewModal() {
    const modal = document.getElementById("tradingViewModal");
    modal.style.display = "none";

    
    const container = document.getElementById("tradingViewModalContent");
    container.innerHTML = "";
    console.log("TradingView-Modal geschlossen und Inhalt bereinigt.");
}
