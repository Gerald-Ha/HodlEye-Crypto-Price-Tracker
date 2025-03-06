const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;

/*
 * Metadata
 * Version: 1.0.4
 * Author/Dev: Gerald Hasani
 * Name: HodlEye Crypto Price Tracker
 * Email: contact@gerald-hasani.com
 * GitHub: https://github.com/Gerald-Ha
 */

console.log("Server gestartet...");



app.use(cors());


const RSS_FEEDS = [
    { name: "crypto_news", url: "https://crypto.news/feed/" },
    { name: "cointelegraph", url: "https://cointelegraph.com/rss" },
    { name: "thedefiant", url: "https://thedefiant.io/api/feed" },
    { name: "newsbtc", url: "https://newsbtc.com/feed" },
    { name: "bitcoin_news", url: "https://news.bitcoin.com/feed" }, // nicht erreichbar mit deutscher ip
    { name: "bitcoinmagazine", url: "https://bitcoinmagazine.com/feed" }, 
    { name: "cryptopanic", url: "https://cryptopanic.com/news/rss/" }, 
    { name: "decrypt", url: "https://decrypt.co/feed" }
];


app.get("/api/news", async (req, res) => {
    try {
        
        const requestedSource = req.query.source;

        
        const fetchFeed = async (feed) => {
            try {
                const response = await axios.get(feed.url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
                    }
                });
                const xml = response.data;

                return new Promise((resolve, reject) => {
                    xml2js.parseString(xml, { trim: true, explicitArray: false }, (err, result) => {
                        if (err) return reject(err);

                        
                        if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
                            console.error(`Kein gültiger RSS-Feed von ${feed.url}`);
                            return resolve([]);
                        }

                        const items = result.rss.channel.item.map(item => ({
                            title: item.title,
                            link: item.link,
                            description: item.description || "Keine Beschreibung verfügbar.",
                            pubDate: new Date(item.pubDate),
                            source: feed.name
                        }));

                        resolve(items);
                    });
                });
            } catch (error) {
                console.error(`Fehler beim Abrufen von ${feed.url}:`, error.message);
                return []; 
            }
        };

        
        const allFeeds = await Promise.all(RSS_FEEDS.map(fetchFeed));

        
        let allArticles = allFeeds.flat().sort((a, b) => b.pubDate - a.pubDate);

        
        if (requestedSource) {
            allArticles = allArticles.filter(article => article.source === requestedSource);
        }

        res.json(allArticles);
    } catch (error) {
        console.error("Fehler beim Abrufen der Feeds:", error);
        res.status(500).json({ error: "Fehler beim Abrufen der Feeds" });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
