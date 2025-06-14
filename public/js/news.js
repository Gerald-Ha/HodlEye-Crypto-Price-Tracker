document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = window.location.protocol + "//" + window.location.hostname + ":5001/api/news"; 
    const newsFeed = document.getElementById("news-feed");
    const searchInput = document.getElementById("search");
    let allArticles = [];

    function refreshNewsFeed() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                allArticles = data;
                displayArticles(allArticles);
            })
            .catch(error => {
                newsFeed.innerHTML = "Error loading the news.";
                console.error("Error when retrieving the news:", error);
            });
    }

    function displayArticles(items) {
        newsFeed.innerHTML = ""; 
        items.forEach(item => {
            let newsItem = document.createElement("div");
            newsItem.classList.add("news-item");

            newsItem.innerHTML = `
                <div class="news-content">
                    <a href="${item.link}" target="_blank" class="news-title">${item.title}</a>
                    <div class="news-meta">
                        <span class="news-source">${formatSourceName(item.source)}</span>
                        <span class="time">${getTimeAgo(item.pubDate)}</span>
                    </div>
                </div>
            `;
            newsFeed.appendChild(newsItem);
        });
    }

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredArticles = allArticles.filter(item =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
        displayArticles(filteredArticles);
    });

    function getTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        if (days < 365) return `${Math.floor(days / 30)} months ago`;
        return `${Math.floor(days / 365)} years ago`;
    }

    function formatSourceName(source) {
        const sourceMap = {
            "crypto_news": "Crypto News",
            "cointelegraph": "Cointelegraph",
            "thedefiant": "The Defiant",
            "newsbtc": "NewsBTC",
            "bitcoin_news": "Bitcoin.com",
            "decrypt": "Decrypt"
        };
        return sourceMap[source] || source;
    }

    refreshNewsFeed();
    setInterval(refreshNewsFeed, 180000);
});
