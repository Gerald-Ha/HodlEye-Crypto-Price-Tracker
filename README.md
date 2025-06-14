# HodlEye Crypto Price Tracker

A lightweight Docker-based web tool to monitor cryptocurrency prices (via Binance and OKX) with **unlimited alarms** and **unlimited crypto tracking**, outshining typical TradingView limitations. It also provides quick access to multiple RSS-based crypto news sources and a live Economic Calendar.

<img src="https://github.com/user-attachments/assets/d87ca663-97be-4c22-a0ab-46505fe9c99f" width="800" height="auto">

## Demo

Check out the live demo here: <a href="https://hodleye.gerald-hasani.com" target="_blank" rel="noopener noreferrer">HodlEye Demo</a>



**Default Login Data**  
**User:** admin  
**Password:** admin


---


## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Unlimited Alarms & Tracking](#unlimited-alarms--tracking)
   - [Price Updates](#price-updates)
   - [Alarm Functionality](#alarm-functionality)
   - [Crypto News](#crypto-news)
   - [Economic Calendar](#economic-calendar)
   - [TradingView Chart](#tradingview-chart)  
3. [Installation & Usage](#installation--usage)
   - [Requirements](#requirements)
   - [Docker Build & Run](#docker-build--run)
4. [Windows Notification App: HodlEye_Notify](#windows-notification-app-hodleye_notify)
5. [Project Structure](#project-structure)
   - [Frontend (index.html & magic.js)](#frontend-indexhtml--magicjs)
   - [News Feed Server (Node.js)](#news-feed-server-nodejs)
6. [Important Notes / Limitations](#important-notes--limitations)
7. [Coming Soon](#coming-soon)
8. [Privacy & Data Disclaimer](#privacy--data-disclaimer)
9. [License](#license)

---

## Overview

**HodlEye Crypto Price Tracker** is a Dockerized application that aims to surpass typical limitations of other tracking platforms (like TradingView), offering:

- **Unlimited Alarms**: No cap on the number of alarms you can set.
- **Unlimited Crypto Tracking**: Easily add as many coins as you want.
- **Real-Time Price Updates (every 1 seconds)**: Uses Binance and OKX data.
- **Crypto News & Economic Calendar**: Stay updated on the latest events affecting the market.
- **TradingView Modal Integration**: Click on any crypto pair to open a TradingView modal for in-depth chart analysis.**New**

The tool refreshes prices every **1 seconds**, which may introduce a slight delay in alarm triggers if the price quickly touches the threshold in between intervals.

---
&nbsp;

## Features

### Unlimited Alarms & Tracking

- You can set **as many alarms as you like** — no daily or total limit.
- Track **any number of cryptocurrencies** in the list simultaneously.

<img src="https://github.com/user-attachments/assets/276de04d-dcf6-411a-b550-cbb5104c1579" width="auto" height="400">

&nbsp;

### Price Updates

- **Binance** and **OKX** are integrated as the primary data sources.
- By default, HodlEye tries Binance first; if that fails or is forced off, it falls back to OKX.
- It automatically fetches the current price, 24h open, 1h open, and calculates the 24h and 1h percentage changes every **1 seconds**.

&nbsp;

### Alarm Functionality

- Set alarms for each coin (e.g., `BTC/USDT`), choosing:
  - **Alarm Price** (threshold)
  - **Direction** (Rising, Falling, or Both)
  - **Frequency** (Once or Recurring)
- When triggered, a popup and sound notification appear, with optional desktop notifications.
- **Once** alarms are marked locally in the browser (not removed from the server) so they do not trigger again unless reloaded or manually reset.

&nbsp;

### Crypto News

- News from multiple RSS sources:
  - `https://crypto.news/feed/`
  - `https://cointelegraph.com/rss`
  - `https://thedefiant.io/api/feed`
  - `https://newsbtc.com/feed`
  - `https://news.bitcoin.com/feed` _(may be inaccessible in certain regions)_
  - `https://bitcoinmagazine.com/feed`
  - `https://cryptopanic.com/news/rss/`
  - `https://decrypt.co/feed`
- Quickly view and filter recent articles within the built-in News modal.

<img src="https://github.com/user-attachments/assets/f0727b39-a075-4d50-9600-f53c803d4a1b" width="auto" height="400">

&nbsp;
### Economic Calendar

- The **Economic Calendar** button opens a modal with an [Investing.com](https://www.investing.com/) iframe, showing major economic events such as central bank decisions and market-impacting announcements.

<img src="https://github.com/user-attachments/assets/e254301e-9aaa-48d8-84e7-6faa598ca8be" width="600" height="auto">


&nbsp;
### TradingView Chart
- The **TradingView Chart** Crypto Box Currency click opens a modal with a Tradingview Chart Window iframe, get a better overview of the charts.
<img src="https://github.com/user-attachments/assets/53bd1553-7679-40c1-afa8-0330cd28a71b" width="600" height="auto">

---
&nbsp;
## Installation & Usage

### Requirements

- [Docker](https://www.docker.com/) installed.
- (Optional) [Docker-Compose](https://docs.docker.com/compose/) if you want a more complex or multi-container setup.

### Docker Build & Run

1. **Clone this repository**

   ```bash
   git clone https://github.com/Gerald-Ha/HodlEye-Crypto-Price-Tracker.git
   cd HodlEye
   ```

2. **Build the Docker image**

   ```bash
   docker buildx build -t hodleye-crypto-tracker .
   ```

   _(Make sure you’re in the same directory as the Dockerfile.)_

3. **Run the container**

   ```bash
   docker run -p 3099:3099 -p 5001:5001 --env-file .env -v hodleye_data:/app/data --name hodleye-container hodleye-crypto-tracker
   ```

   - Port `3099` serves the main web interface.
   - Port `5001` is used by the Node.js server that fetches news RSS feeds.

4. **Access the application**
   - **Main UI**: [http://localhost:3099](http://localhost:3099)
   - **News Feed Endpoint**: [http://localhost:5001/api/news](http://localhost:5001/api/news)

---
&nbsp;
## Windows Notification App: HodlEye_Notify

<img src="https://github.com/user-attachments/assets/a3356708-1b3a-4fb8-9a71-d1af88f29c5f" width="auto" height="150">
<img src="https://github.com/user-attachments/assets/cb0eb2a8-45fb-4a80-bb81-56957e838153" width="auto" height="150">

If you prefer not to keep the HodlEye Crypto Price Tracker web interface open in your browser all the time, you can use a lightweight Windows application called **HodlEye_Notify**. This tool connects directly to the same endpoint as the Docker container and will display notifications on your desktop whenever an alarm is triggered.

&nbsp;
1.  **Setup**

    - Enter the IP address and port of your HodlEye Docker container (for example, `http://192.168.1.112:3099/`) in the HodlEye_Notify window.
    - Click **Connect** to establish a WebSocket connection.
    - Once connected, you’ll see the status change to “Connected.”

2.  **Autostart**

    - Add HodlEye_Notify to your Windows **Startup** folder so it automatically launches when Windows starts. This way, you’ll continuously receive notifications without needing to reopen the program manually.

3.  **Testing Notifications**

    - From the machine running the Docker container, you can trigger a test notification using the following `curl` command:

    **Ubuntu**
    ```bash
     curl -X POST http://192.168.1.112:3099/api/notifications \
          -H "Content-Type: application/json" \
          -d "{\"message\": \"⚠️ ALARM (Recurring, Both): BTC reached 92250\", \"timestamp\": \"2025-03-06T06:19:58.584Z\"}"
	```

	**Windows CMD**
	```bash

    curl -X POST http://192.168.1.112:3099/api/notifications -H "Content-Type: application/json" -d "{\"message\": \"⚠️ ALARM (Recurring, Both): BTC reached 92250\", \"timestamp\": \"2025-03-06T06:19:58.584Z\"}"
	```

- If everything is configured correctly, you should receive a desktop notification from HodlEye_Notify indicating the alarm has triggered.

This application simplifies the process of staying informed about your alarms, letting you work on other tasks without leaving the HodlEye web interface open.

---
&nbsp;
## Project Structure

Below is an example directory tree (based on your structure). Yours may vary slightly:

```
HodlEye-Crypto-Price-Tracker
├── Dockerfile
├── LICENSE.txt
├── PRIVACY.md
├── README.md
├── data
│   └── data.json
├── public
│   ├── font
│   │   └── BreeSerif-Regular.ttf
│   ├── images
│   │   ├── Gitea_Logo.svg
│   │   ├── coffee.svg
│   │   ├── favicon.png
│   │   └── github-mark.svg
│   ├── index.html
│   ├── magic.js
│   ├── news.js
│   ├── tradingview.js
│   ├── script.js
│   ├── responsive.css
│   ├── sound
│   │   ├── cashing.mp3
│   │   └── ping.mp3
│   ├── style.css
│   └── update.js
├── server
│   ├── newsfeed
│   │   ├── node_modules
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   └── server.js
│   ├── node_modules
│   ├── package-lock.json
│   ├── package.json
│   └── server.js
├── sound
│   ├── cashing.mp3
│   └── ping.mp3
└── update.json
```

&nbsp;
### Frontend (`index.html` & `magic.js`)

- **`index.html`**
  - Main interface containing modals and buttons (Add Crypto, Edit List, Alarms, Options, etc.).
  - Includes buttons for:
    - **Crypto News** (opens a news modal)
    - **Economic Calendar** (Investing.com iframe)
    - **Unlimited Alarms** management
    - **Options** (Dark mode, alarm sounds, desktop notifications)
    - **Buy me a Coffee** donation button
- **`magic.js`**
  - Core logic:
    - Fetches cryptos (`/api/cryptos`)
    - Loads alarms (`/api/alarms`) and notifications (`/api/notifications`)
    - Pulls prices from Binance/OKX every 1 seconds
    - Checks and triggers alarms
    - Handles UI rendering (prices, alarms, notifications, drag & drop reorder)

&nbsp;
### News Feed Server (Node.js)

- A minimal Node.js Express server (in `server.js` or similar) which:
  - Retrieves the listed RSS feeds and parses them via `xml2js`
  - Serves them in JSON format at `/api/news`
- Default port is `5001` (overridden by `process.env.PORT` if set).
- Example local usage (non-Docker):
  ```bash
  cd feed-server
  npm install
  node server.js
  ```
  - Accessible at [http://localhost:5001/api/news](http://localhost:5001/api/news).

_(Within Docker, it’s already bundled, so just expose `5001`.)_

---

&nbsp;
## Important Notes / Limitations

1. **1-second polling**

   - There’s a potential delay in alarms because price thresholds are only checked every 1 seconds. If a price briefly touches and moves away between polls, you might miss that exact trigger moment.

2. **API availability**

   - Binance/OKX may be temporarily down or might not support certain symbols.
   - HodlEye tries Binance → fallback to OKX if needed.

3. **Unlimited Alarms (Once vs. Recurring)**

   - **Once** alarms become locally “triggered” to avoid repeated alerts but are not server-side deactivated.
   - **Recurring** triggers repeatedly every time the threshold is crossed.

4. **RSS Feeds**
   - Some feeds might be inaccessible in certain regions (`bitcoin_news` in Germany, for instance).
   - Economic Calendar content is loaded from an `<iframe>` pointing to Investing.com.

---

&nbsp;
## Coming Soon

Exciting new features and improvements are on the way! Here are some planned updates:

- **Portfolio Management**: Track your crypto holdings in real-time with easy-to-read analytics.
- **More Integrations**: Expanding support for additional exchanges and data sources.
- **Automatic alarm in the event of a sharp price drop of 10% within 1 hour**
- **HodlEye Notify Alarm with various sound selections and HodlEye Alarms**


Stay tuned for updates!



---

&nbsp;
## Privacy & Data Disclaimer

- **No Data Collection by This Application**: HodlEye itself does not collect, store, or process any personal data or usage analytics.
- **External Services**: Certain features (e.g., news feeds, iframes) rely on third-party websites or APIs. We do not control and are not responsible for the data-collection practices or privacy policies of these external providers. Please refer to the privacy policies of those services for details.

---





&nbsp;
