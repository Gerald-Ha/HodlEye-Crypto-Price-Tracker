
       
        let cryptoList = [];      
        let alarms = [];          
        let notifications = [];   
        let lastPrices = {};     

        
        let userOptions = JSON.parse(localStorage.getItem("userOptions")) || {
            soundFile: "ping.mp3",
            darkMode: true,
            enableDesktopNotifications: false,
            okxApiKey: "",
            okxSecretKey: "",
            okxPassphrase: ""
        };

       
        let apiPreference = JSON.parse(localStorage.getItem("apiPreference")) || {};

        
        let editMode = false;

        
        let currentApiSelectSymbol = null;

        
        async function loadCryptosFromServer() {
            try {
                const resp = await fetch("/api/cryptos");
                cryptoList = await resp.json();  
                renderCryptoGrid();
            } catch (err) {
                console.error("Fehler beim Laden der Kryptoliste:", err);
            }
        }

        async function addNewCrypto() {
            const newCrypto = document.getElementById("newCryptoSymbol").value.trim().toUpperCase();
            if (!newCrypto) return;

            
            if (!(await isBinanceSupported(newCrypto)) && !(await isOkxSupported(newCrypto))) {
                showErrorMessage("This cryptocurrency is not supported on Binance or OKX (USDT).");
                closeAddCryptoModal();
                return;
            }

            
            try {
                const resp = await fetch("/api/cryptos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbol: newCrypto })
                });
                const updatedList = await resp.json(); 
                cryptoList = updatedList;
                renderCryptoGrid();
            } catch (err) {
                showErrorMessage("Error adding new crypto: " + err.message);
            }
            closeAddCryptoModal();
        }

        async function deleteCrypto(index) {
            const symbol = cryptoList[index];
            if (!symbol) return;
            try {
                await fetch(`/api/cryptos/${symbol}`, { method: "DELETE" });
                
                loadCryptosFromServer();
            } catch (err) {
                showErrorMessage("Error deleting crypto: " + err.message);
            }
        }

        
        async function loadAlarmsFromServer() {
            try {
                const resp = await fetch("/api/alarms");
                alarms = await resp.json();
                renderAlarmList();
            } catch (err) {
                console.error("Fehler beim Laden der Alarme:", err);
            }
        }

        async function addAlarm() {
            const symbol = document.getElementById("alarmSymbol").value;
            const price = parseFloat(document.getElementById("alarmPrice").value);
            const frequency = document.getElementById("alarmFrequency").value;
            const direction = document.getElementById("alarmDirection").value;

            if (!symbol || isNaN(price)) return;

            try {
                
                await fetch("/api/alarms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbol, price, frequency, direction })
                });
                
                loadAlarmsFromServer();
            } catch (err) {
                showErrorMessage("Error adding alarm: " + err.message);
            }
        }

        async function deleteAlarm(alarmId) {
            try {
                await fetch(`/api/alarms/${alarmId}`, { method: "DELETE" });
                loadAlarmsFromServer();
            } catch (err) {
                showErrorMessage("Error deleting alarm: " + err.message);
            }
        }

        
        async function loadNotificationsFromServer() {
            try {
                const resp = await fetch("/api/notifications");
                notifications = await resp.json();
                renderNotifications();
            } catch (err) {
                console.error("Fehler beim Laden der Notifications:", err);
            }
        }

        async function addNotification(msg) {
            
            try {
                await fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: msg })
                });
                loadNotificationsFromServer();
            } catch (err) {
                console.error("Fehler beim Hinzufügen einer Notification:", err);
            }
        }

        async function clearNotifications() {
           
            try {
                await fetch("/api/notifications", { method: "DELETE" });
                loadNotificationsFromServer();
            } catch (err) {
                console.error("Fehler beim Löschen der Notifications:", err);
            }
        }

        
        async function init() {
            
            document.getElementById("alarmSound").src = "sound/" + userOptions.soundFile;
            updateTheme(userOptions.darkMode);

           
            await loadCryptosFromServer();
            await loadAlarmsFromServer();
            await loadNotificationsFromServer();

            
            setInterval(() => {
                cryptoList.forEach((symbol, index) => {
                    const elementId = "crypto-" + index;
                    fetchCryptoData(symbol, elementId)
                        .catch(() => setNotSupported(elementId));
                });
            }, 5000);

            
            renderNotifications();
        }

       
        function renderCryptoGrid() {
            const grid = document.getElementById("cryptoGrid");
            grid.innerHTML = "";

            cryptoList.forEach((symbol, index) => {
                const boxId = "crypto-" + index;

                const box = document.createElement("div");
                box.className = "crypto-box";
                box.id = boxId;

                const heading = document.createElement("h2");
                heading.textContent = `${symbol}/USDT`;
                box.appendChild(heading);

                const dailyP = document.createElement("p");
                dailyP.id = "daily-" + boxId;
                dailyP.textContent = "Daily Price: -";
                box.appendChild(dailyP);

                const hourlyP = document.createElement("p");
                hourlyP.id = "hourly-" + boxId;
                hourlyP.textContent = "Price H: -";
                box.appendChild(hourlyP);

                const priceP = document.createElement("p");
                priceP.id = "price-" + boxId;
                priceP.innerHTML = "<strong>Current Price:</strong> -";
                box.appendChild(priceP);

                const change24 = document.createElement("p");
                change24.id = "change24-" + boxId;
                change24.textContent = "24h Change: -";
                box.appendChild(change24);

                const change1h = document.createElement("p");
                change1h.id = "change1h-" + boxId;
                change1h.textContent = "1h Change: -";
                box.appendChild(change1h);

                
                const apiLabel = document.createElement("div");
                apiLabel.id = "api-" + boxId;
                apiLabel.className = "api-label";
                apiLabel.textContent = "API: ?";
                apiLabel.addEventListener("click", () => {
                    openApiSelectModal(symbol);
                });
                box.appendChild(apiLabel);

                
                if (editMode) {
                    box.draggable = true;
                    box.setAttribute("data-index", index);

                    box.addEventListener("dragstart", handleDragStart);
                    box.addEventListener("dragend", handleDragEnd);
                    box.addEventListener("dragover", handleDragOver);
                    box.addEventListener("dragleave", handleDragLeave);
                    box.addEventListener("drop", handleDrop);

                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "X";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        deleteCrypto(index);
                    });
                    box.appendChild(deleteBtn);
                }

                grid.appendChild(box);

                
                fetchCryptoData(symbol, boxId).catch(() => setNotSupported(boxId));
            });
        }

        function renderAlarmList() {
            const container = document.getElementById("alarmListContainer");
            container.innerHTML = "";

            alarms.forEach(alarm => {
                const item = document.createElement("div");
                item.className = "alarm-item";

                const textSpan = document.createElement("span");
                textSpan.innerText = `${alarm.symbol}: ${alarm.price} (${alarm.frequency}, ${alarm.direction})`;
                item.appendChild(textSpan);

                const delBtn = document.createElement("button");
                delBtn.innerHTML = "🗑";
                delBtn.className = "alarm-delete-btn";
                delBtn.onclick = () => deleteAlarm(alarm.id);

                item.appendChild(delBtn);
                container.appendChild(item);
            });
        }

        function renderNotifications() {
            const notifyList = document.getElementById("notifyList");
            notifyList.innerHTML = "";
            notifications.forEach((item) => {
                const li = document.createElement("li");
                li.className = "notify-item";
                li.innerHTML = `
                    <div>${item.message}</div>
                    <div class="timestamp">${item.timestamp}</div>
                `;
                notifyList.appendChild(li);
            });
        }

       /* ------------------------------------------------------------------
   EINFACHE UI-Funktionen: Modal open/close
------------------------------------------------------------------ */

function openAddCryptoModal() {
    document.getElementById("addCryptoModal").style.display = "block";
    document.getElementById("newCryptoSymbol").value = "";
}

function closeAddCryptoModal() {
    document.getElementById("addCryptoModal").style.display = "none";
}

function openAlarmModal() {
    document.getElementById("alarmModal").style.display = "block";
    
    const dropdown = document.getElementById("alarmSymbol");
    dropdown.innerHTML = "";
    cryptoList.forEach(symbol => {
        const option = document.createElement("option");
        option.value = symbol;
        option.textContent = symbol;
        dropdown.appendChild(option);
    });
    renderAlarmList();
}

function closeAlarmModal() {
    document.getElementById("alarmModal").style.display = "none";
}

function openOptionsModal() {
    document.getElementById("optionsModal").style.display = "block";
    document.getElementById("soundSelect").value = userOptions.soundFile;
    document.getElementById("darkModeToggle").checked = userOptions.darkMode;
    document.getElementById("desktopNotifyToggle").checked = userOptions.enableDesktopNotifications;
}

function closeOptionsModal() {
    document.getElementById("optionsModal").style.display = "none";
}

function openApiModal() {
    document.getElementById("apiModal").style.display = "block";
    document.getElementById("okxApiKey").value = userOptions.okxApiKey || "";
    document.getElementById("okxSecretKey").value = userOptions.okxSecretKey || "";
    document.getElementById("okxPassphrase").value = userOptions.okxPassphrase || "";
}

function closeApiModal() {
    document.getElementById("apiModal").style.display = "none";
}

function openApiSelectModal(symbol) {
    currentApiSelectSymbol = symbol;
    document.getElementById("apiSelectSymbol").textContent = symbol;
    const currentVal = apiPreference[symbol] || "auto";
    document.getElementById("apiSelectDropdown").value = currentVal;
    document.getElementById("apiSelectModal").style.display = "block";
}

function closeApiSelectModal() {
    document.getElementById("apiSelectModal").style.display = "none";
}

function openBuyMeModal() {
    document.getElementById("buyMeModal").style.display = "block";
}

function closeBuyMeModal() {
    document.getElementById("buyMeModal").style.display = "none";
}

/* ------------------------------------------------------------------
   NEU: Crypto News & Economic Calendar Modals
------------------------------------------------------------------ */

function openCryptoNews() {
    document.getElementById("cryptoNewsModal").style.display = "block";
}

function closeCryptoNewsModal() {
    document.getElementById("cryptoNewsModal").style.display = "none";
}

function openEconomicCalendar() {
    document.getElementById("economicCalendarModal").style.display = "block";
}

function closeEconomicCalendarModal() {
    document.getElementById("economicCalendarModal").style.display = "none";
}



function saveOptions() {
    userOptions.soundFile = document.getElementById("soundSelect").value;
    const alarmSound = document.getElementById("alarmSound");
    alarmSound.src = "sound/" + userOptions.soundFile;
    alarmSound.load();

    userOptions.darkMode = document.getElementById("darkModeToggle").checked;
    updateTheme(userOptions.darkMode);

    userOptions.enableDesktopNotifications = document.getElementById("desktopNotifyToggle").checked;

    localStorage.setItem("userOptions", JSON.stringify(userOptions));
    renderCryptoGrid(); 
    closeOptionsModal();
}

function updateTheme(darkMode) {
    if (darkMode) {
        document.body.classList.remove("light");
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
        document.body.classList.add("light");
    }
}

function saveApiSettings() {
    userOptions.okxApiKey = document.getElementById("okxApiKey").value;
    userOptions.okxSecretKey = document.getElementById("okxSecretKey").value;
    userOptions.okxPassphrase = document.getElementById("okxPassphrase").value;

    localStorage.setItem("userOptions", JSON.stringify(userOptions));
    closeApiModal();
}

function saveApiSelection() {
    const val = document.getElementById("apiSelectDropdown").value;
    if (currentApiSelectSymbol) {
        apiPreference[currentApiSelectSymbol] = val;
        localStorage.setItem("apiPreference", JSON.stringify(apiPreference));
        renderCryptoGrid();
    }
    closeApiSelectModal();
}

/* ------------------------------------------------------------------
   EDIT MODE (Drag & Drop)
------------------------------------------------------------------ */
function toggleEditMode() {
    editMode = !editMode;
    document.getElementById("editButton").textContent = editMode ? "Done" : "Edit List";
    renderCryptoGrid();
}

function handleDragStart(event) {
    event.currentTarget.classList.add("dragging");
    const index = event.currentTarget.getAttribute("data-index");
    event.dataTransfer.setData("text/plain", index);
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    const fromIndex = parseInt(event.dataTransfer.getData("text/plain"), 10);
    const toIndex = parseInt(event.currentTarget.getAttribute("data-index"), 10);
    reorderCryptoList(fromIndex, toIndex);
}

async function reorderCryptoList(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const item = cryptoList.splice(fromIndex, 1)[0];
    cryptoList.splice(toIndex, 0, item);

    
    renderCryptoGrid();
}


       
        async function fetchCryptoData(symbol, elementId) {
            const preferredApi = apiPreference[symbol] || "auto";
            
            if (preferredApi === "binance") {
                if (await isBinanceSupported(symbol)) {
                    return fetchFromBinance(symbol, elementId);
                } else {
                    return setNotSupported(elementId);
                }
            }
            if (preferredApi === "okx") {
                if (await isOkxSupported(symbol)) {
                    return fetchFromOkx(symbol, elementId);
                } else {
                    return setNotSupported(elementId);
                }
            }
            
            if (await isBinanceSupported(symbol)) {
                return fetchFromBinance(symbol, elementId);
            } else if (await isOkxSupported(symbol)) {
                return fetchFromOkx(symbol, elementId);
            } else {
                return setNotSupported(elementId);
            }
        }

        function setNotSupported(elementId) {
            document.getElementById("daily-" + elementId).textContent = "Daily Price: ❌";
            document.getElementById("hourly-" + elementId).textContent = "Price H: ❌";
            document.getElementById("price-" + elementId).innerHTML = "<strong>Current Price:</strong> ❌ Not supported";
            document.getElementById("change24-" + elementId).textContent = "24h Change: -";
            document.getElementById("change1h-" + elementId).textContent = "1h Change: -";
            document.getElementById("api-" + elementId).textContent = "API: ?";
        }

        
        async function fetchFromBinance(symbol, elementId) {
            const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`;
            let resp = await fetch(tickerUrl);
            if (!resp.ok) throw new Error("Binance request failed");
            let data = await resp.json();
            if (data.code) throw new Error("Binance error code");

            const dailyOpen = parseFloat(data.openPrice);
            const lastPrice = parseFloat(data.lastPrice);
            const priceChange24h = parseFloat(data.priceChangePercent);

            
            const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1h&limit=1`;
            let klResp = await fetch(klineUrl);
            if (!klResp.ok) throw new Error("Binance 1h kline request failed");
            let kData = await klResp.json();
            if (!kData[0]) throw new Error("No 1h data from Binance");

            const hourlyOpen = parseFloat(kData[0][1]);
            const closeNow = parseFloat(kData[0][4]);
            let pct1h = 0;
            if (hourlyOpen !== 0) {
                pct1h = ((closeNow - hourlyOpen) / hourlyOpen) * 100;
            }

            updateCryptoBox({
                symbol,
                elementId,
                apiUsed: "Binance",
                dailyOpen,
                hourlyOpen,
                lastPrice,
                change24h: priceChange24h,
                change1h: pct1h
            });
        }

        
        async function fetchFromOkx(symbol, elementId) {
            const instId = `${symbol}-USDT`;
            const tickerUrl = `https://www.okx.com/api/v5/market/ticker?instId=${instId}`;
            let resp = await fetch(tickerUrl);
            if (!resp.ok) throw new Error("OKX request failed");
            let data = await resp.json();
            if (!data.data || !data.data[0]) throw new Error("OKX no ticker data");

            const ticker = data.data[0];
            const dailyOpen = parseFloat(ticker.open24h);
            const lastPrice = parseFloat(ticker.last);

            let pct24 = 0;
            if (dailyOpen !== 0) {
                pct24 = ((lastPrice - dailyOpen) / dailyOpen) * 100;
            }

            
            const cUrl = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=1H&limit=1`;
            let cResp = await fetch(cUrl);
            if (!cResp.ok) throw new Error("OKX 1h candle request failed");
            let cData = await cResp.json();
            if (!cData.data || !cData.data[0]) throw new Error("OKX no 1h data");

            const hourlyOpen = parseFloat(cData.data[0][1]);
            const closeNow = parseFloat(cData.data[0][4]);
            let pct1h = 0;
            if (hourlyOpen !== 0) {
                pct1h = ((closeNow - hourlyOpen) / hourlyOpen) * 100;
            }

            updateCryptoBox({
                symbol,
                elementId,
                apiUsed: "OKX",
                dailyOpen,
                hourlyOpen,
                lastPrice,
                change24h: pct24,
                change1h: pct1h
            });
        }

        function updateCryptoBox({
            symbol,
            elementId,
            apiUsed,
            dailyOpen,
            hourlyOpen,
            lastPrice,
            change24h,
            change1h
        }) {
            const dOpenStr = isNaN(dailyOpen) ? "-" : dailyOpen.toFixed(4);
            const hOpenStr = isNaN(hourlyOpen) ? "-" : hourlyOpen.toFixed(4);
            const lastStr = isNaN(lastPrice) ? "-" : lastPrice.toFixed(4);

            const pct24Str = isNaN(change24h) ? "-" : change24h.toFixed(2) + "%";
            const pct1hStr = isNaN(change1h) ? "-" : change1h.toFixed(2) + "%";

            document.getElementById("daily-" + elementId).textContent = "Daily Price: " + dOpenStr + " USDT";
            document.getElementById("hourly-" + elementId).textContent = "Price H: " + hOpenStr + " USDT";
            document.getElementById("price-" + elementId).innerHTML =
                `<strong>Current Price:</strong> ${lastStr} USDT`;

            const c24 = document.getElementById("change24-" + elementId);
            c24.textContent = "24h Change: " + pct24Str;
            c24.className = "change " + (change24h >= 0 ? "up" : "down");

            const c1h = document.getElementById("change1h-" + elementId);
            c1h.textContent = "1h Change: " + pct1hStr;
            c1h.className = "change " + (change1h >= 0 ? "up" : "down");

            document.getElementById("api-" + elementId).textContent = "API: " + apiUsed;

            
            checkAlarms(symbol, lastPrice);
            lastPrices[symbol] = lastPrice;
        }

       
        function checkAlarms(symbol, currentPrice) {
            alarms.forEach(alarm => {
                if (alarm.symbol !== symbol) return;
               
                if (alarm.triggered) return;

                const alarmPrice = parseFloat(alarm.price);
                const prevPrice = lastPrices[symbol] || null;
                if (prevPrice === null || isNaN(prevPrice)) return;

                let conditionMet = false;
                if (alarm.direction === "Rising") {
                    conditionMet = (prevPrice < alarmPrice && currentPrice >= alarmPrice);
                } else if (alarm.direction === "Falling") {
                    conditionMet = (prevPrice > alarmPrice && currentPrice <= alarmPrice);
                } else if (alarm.direction === "Both") {
                    const crossingUp = (prevPrice < alarmPrice && currentPrice >= alarmPrice);
                    const crossingDown = (prevPrice > alarmPrice && currentPrice <= alarmPrice);
                    conditionMet = crossingUp || crossingDown;
                }

                if (conditionMet) {
                    const msg = `⚠️ ALARM (${alarm.frequency}, ${alarm.direction}): ${symbol} reached ${alarmPrice}!`;
                    showAlarmPopup(msg);

                   
                    if (alarm.frequency === "Once") {
                        alarm.triggered = true; 
                        
                    }
                }
            });
        }

       
        function showErrorMessage(msg) {
            document.getElementById("errorMessage").textContent = msg;
            document.getElementById("errorOverlay").style.display = "block";
        }
        function closeErrorPopup() {
            document.getElementById("errorOverlay").style.display = "none";
        }

        function showAlarmPopup(message) {
            document.getElementById("alarmMessage").textContent = message;
            document.getElementById("alarmOverlay").style.display = "block";
            document.getElementById("alarmSound").play();
            addNotification(message); 
            if (userOptions.enableDesktopNotifications && "Notification" in window) {
                if (Notification.permission === "granted") {
                    new Notification("Crypto Price Alarm", { body: message });
                } else if (Notification.permission !== "denied") {
                    Notification.requestPermission().then(permission => {
                        if (permission === "granted") {
                            new Notification("Crypto Price Alarm", { body: message });
                        }
                    });
                }
            }
        }
        function closeAlarmPopup() {
            document.getElementById("alarmOverlay").style.display = "none";
        }

        function copyToClipboard(address) {
            navigator.clipboard.writeText(address).then(() => {
                alert("Address is copied to the clipboard.");
            });
        }

        
        async function isBinanceSupported(symbol) {
            const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`;
            try {
                const response = await fetch(url);
                if (!response.ok) return false;
                const data = await response.json();
                if (data.code) return false; 
                return true;
            } catch {
                return false;
            }
        }

        async function isOkxSupported(symbol) {
            const instId = `${symbol}-USDT`;
            const okxUrl = `https://www.okx.com/api/v5/market/ticker?instId=${instId}`;
            try {
                const response = await fetch(okxUrl);
                if (!response.ok) return false;
                const data = await response.json();
                if (!data.data || !data.data[0]) return false;
                return true;
            } catch {
                return false;
            }
        }

        
        window.addEventListener("DOMContentLoaded", init);


        function copyToClipboard(address) {
  if (navigator.clipboard && window.isSecureContext) {
    
    navigator.clipboard.writeText(address).then(() => {
      alert("Address is copied to the clipboard.");
    }).catch(err => {
      console.error("Clipboard API Fehler:", err);
      alert("Fehler beim Kopieren der Adresse.");
    });
  } else {
    
    let textArea = document.createElement("textarea");
    textArea.value = address;
    
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert("Address is copied to the clipboard.");
    } catch (err) {
      console.error("Fallback Copy Fehler:", err);
      alert("Fehler beim Kopieren der Adresse.");
    }
    document.body.removeChild(textArea);
  }
}
