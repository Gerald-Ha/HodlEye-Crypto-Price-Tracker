const CURRENT_VERSION = "1.5.1";

function getUpdateUrl() {
    return "/api/update?t=" + new Date().getTime();
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("currentVersion").textContent = `Version ${CURRENT_VERSION}`;
    checkForUpdates();

    
    setInterval(checkForUpdates, 86400000);

});

function checkForUpdates() {
    fetch(getUpdateUrl())
        .then((response) => response.json())
        .then((data) => {
            let skippedVersion = localStorage.getItem("skippedVersion") || null;


            if (skippedVersion && data.version !== skippedVersion) {
                localStorage.removeItem("skippedVersion");
                skippedVersion = null;
            }


            if (compareVersions(data.version, CURRENT_VERSION) > 0) {
                const updateAvailableEl = document.getElementById("updateAvailable");
                updateAvailableEl.style.display = "inline";


                updateAvailableEl.onclick = () => {
                    fetch(getUpdateUrl())
                        .then((response) => response.json())
                        .then((data) => {
                            let skippedVersion = localStorage.getItem("skippedVersion") || null;
                            if (skippedVersion && data.version !== skippedVersion) {
                                localStorage.removeItem("skippedVersion");
                                skippedVersion = null;
                            }
                            openUpdateModal(data);
                        })
                        .catch((error) =>
                            console.error("Fehler beim erneuten Abrufen des Updates:", error)
                        );
                };
            }
        })
        .catch((error) =>
            console.error("Fehler beim Abrufen des Updates:", error)
        );
}

function compareVersions(v1, v2) {
    const v1parts = v1.split(".").map(Number);
    const v2parts = v2.split(".").map(Number);
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
        const num1 = v1parts[i] || 0;
        const num2 = v2parts[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

function openUpdateModal(data) {
  
    document.getElementById("updateVersion").textContent = data.version;

   
    let changelogContainer = document.getElementById("updateChanges");
    changelogContainer.innerHTML = "";


    if (Array.isArray(data.changelog)) {
        let ul = document.createElement("ul");
        data.changelog.forEach(item => {
            let li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });
        changelogContainer.appendChild(ul);
    } else {
        
        changelogContainer.textContent = data.changelog || "Kein Changelog vorhanden.";
    }


    window._updateData = data;

   
    document.getElementById("updateModal").style.display = "block";
}

function closeUpdateModal() {
    document.getElementById("updateModal").style.display = "none";
}

function performUpdate() {
   
    window.open("https://github.com/Gerald-Ha/HodlEye-Crypto-Price-Tracker", "_blank");
    closeUpdateModal();
}

function skipUpdate() {
   
    if (window._updateData && window._updateData.version) {
        localStorage.setItem("skippedVersion", window._updateData.version);
    }
    closeUpdateModal();
}
