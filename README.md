# HodlEye Crypto Price Tracker

A lightweight Docker-based web tool to monitor cryptocurrency prices (via Binance and OKX) with **unlimited alarms** and **unlimited crypto tracking**, outshining typical TradingView limitations. It also provides quick access to multiple RSS-based crypto news sources and a live Economic Calendar.



---



## Demo

Check out the live demo here: [HodlEye Demo](https://hodleye.gerald-hasani.com/)

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
   - [Unlimited Alarms & Tracking](#unlimited-alarms--tracking)  
   - [Price Updates](#price-updates)  
   - [Alarm Functionality](#alarm-functionality)  
   - [Crypto News](#crypto-news)  
   - [Economic Calendar](#economic-calendar)  
3. [Installation & Usage](#installation--usage)  
   - [Requirements](#requirements)  
   - [Docker Build & Run](#docker-build--run)  
4. [Project Structure](#project-structure)  
   - [Frontend (`index.html` & `magic.js`)](#frontend-indexhtml--magicjs)  
   - [News Feed Server (Node.js)](#news-feed-server-nodejs)  
5. [Important Notes / Limitations](#important-notes--limitations)  
6. [Privacy & Data Disclaimer](#privacy--data-disclaimer)  
7. [License](#license)

---

## Overview

**HodlEye Crypto Price Tracker** is a Dockerized application that aims to surpass typical limitations of other tracking platforms (like TradingView), offering:

- **Unlimited Alarms**: No cap on the number of alarms you can set.  
- **Unlimited Crypto Tracking**: Easily add as many coins as you want.  
- **Real-Time Price Updates (every 5 seconds)**: Uses Binance and OKX data.  
- **Crypto News & Economic Calendar**: Stay updated on the latest events affecting the market.

The tool refreshes prices every **5 seconds**, which may introduce a slight delay in alarm triggers if the price quickly touches the threshold in between intervals.

---

## Features

### Unlimited Alarms & Tracking
- You can set **as many alarms as you like** — no daily or total limit.
- Track **any number of cryptocurrencies** in the list simultaneously.

### Price Updates
- **Binance** and **OKX** are integrated as the primary data sources.
- By default, HodlEye tries Binance first; if that fails or is forced off, it falls back to OKX.
- It automatically fetches the current price, 24h open, 1h open, and calculates the 24h and 1h percentage changes every **5 seconds**.

### Alarm Functionality
- Set alarms for each coin (e.g., `BTC/USDT`), choosing:
  - **Alarm Price** (threshold)
  - **Direction** (Rising, Falling, or Both)
  - **Frequency** (Once or Recurring)
- When triggered, a popup and sound notification appear, with optional desktop notifications.
- **Once** alarms are marked locally in the browser (not removed from the server) so they do not trigger again unless reloaded or manually reset.

### Crypto News
- News from multiple RSS sources:
  - `https://crypto.news/feed/`  
  - `https://cointelegraph.com/rss`  
  - `https://thedefiant.io/api/feed`  
  - `https://newsbtc.com/feed`  
  - `https://news.bitcoin.com/feed` *(may be inaccessible in certain regions)*  
  - `https://bitcoinmagazine.com/feed`  
  - `https://cryptopanic.com/news/rss/`  
  - `https://decrypt.co/feed`
- Quickly view and filter recent articles within the built-in News modal.

### Economic Calendar
- The **Economic Calendar** button opens a modal with an [Investing.com](https://www.investing.com/) iframe, showing major economic events such as central bank decisions and market-impacting announcements.

---

## Installation & Usage

### Requirements
- [Docker](https://www.docker.com/) installed.
- (Optional) [Docker-Compose](https://docs.docker.com/compose/) if you want a more complex or multi-container setup.

### Docker Build & Run

1. **Clone this repository**  
   ```bash
   git clone https://github.com/YourGitHubName/HodlEye.git
   cd HodlEye
   ```

2. **Build the Docker image**  
   ```bash
   docker buildx build -t hodleye-crypto-tracker .
   ```
   *(Make sure you’re in the same directory as the Dockerfile.)*

3. **Run the container**  
   ```bash
   docker run -d -p 3099:3099 -p 5001:5001 --name hodleye-container hodleye-crypto-tracker
   ```
   - Port `3099` serves the main web interface.  
   - Port `5001` is used by the Node.js server that fetches news RSS feeds.

4. **Access the application**  
   - **Main UI**: [http://localhost:3099](http://localhost:3099)  
   - **News Feed Endpoint**: [http://localhost:5001/api/news](http://localhost:5001/api/news)

---

## Project Structure

Below is an example directory tree (based on your structure). Yours may vary slightly:

```
HodlEye-Crypto-Price-Tracker
├── Dockerfile
├── data
│   └── data.json
├── public
│   ├── font
│   │   └── BreeSerif-Regular.ttf
│   ├── images
│   │   ├── coffee.svg
│   │   └── favicon.png
│   ├── index.html
│   ├── magic.js
│   ├── news.js
│   ├── sound
│   │   ├── cashing.mp3
│   │   └── ping.mp3
│   └── style.css
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
└── sound
    ├── cashing.mp3
    └── ping.mp3
```

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
    - Pulls prices from Binance/OKX every 5 seconds  
    - Checks and triggers alarms  
    - Handles UI rendering (prices, alarms, notifications, drag & drop reorder)

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

*(Within Docker, it’s already bundled, so just expose `5001`.)*

---

## Important Notes / Limitations

1. **5-second polling**  
   - There’s a potential delay in alarms because price thresholds are only checked every 5 seconds. If a price briefly touches and moves away between polls, you might miss that exact trigger moment.

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

## Coming Soon

Exciting new features and improvements are on the way! Here are some planned updates:

- **Portfolio Management**: Track your crypto holdings in real-time with easy-to-read analytics.
- **Windows Notification App**: A lightweight Windows application to receive price alerts and notifications directly on your desktop.
- **More Integrations**: Expanding support for additional exchanges and data sources.


Stay tuned for updates!

---



---

## Privacy & Data Disclaimer

- **No Data Collection by This Application**: HodlEye itself does not collect, store, or process any personal data or usage analytics.  
- **External Services**: Certain features (e.g., news feeds, iframes) rely on third-party websites or APIs. We do not control and are not responsible for the data-collection practices or privacy policies of these external providers. Please refer to the privacy policies of those services for details.  

---