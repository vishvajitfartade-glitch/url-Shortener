const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const shortenBtn = document.getElementById("shortenBtn");

const errorMessage = document.getElementById("errorMessage");

const resultBox = document.getElementById("resultBox");
const shortUrl = document.getElementById("shortUrl");
const copyBtn = document.getElementById("copyBtn");
const openLink = document.getElementById("openLink");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");


// Load history when page opens
document.addEventListener("DOMContentLoaded", loadHistory);


// Validate URL
function isValidURL(value) {

    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch (error) {
        return false;
    }
}


// Shorten URL
urlForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const originalUrl = urlInput.value.trim();

    errorMessage.textContent = "";
    resultBox.classList.add("hidden");

    // Validation
    if (!isValidURL(originalUrl)) {

        errorMessage.textContent =
            "Please enter a valid URL starting with http:// or https://";

        return;
    }

    shortenBtn.disabled = true;
    shortenBtn.textContent = "Shortening...";

    try {

        /*
         * is.gd public API
         * format=json returns JSON response
         */
        const apiUrl =
            "https://is.gd/create.php?format=json&url=" +
            encodeURIComponent(originalUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        if (data.shorturl) {

            displayResult(
                originalUrl,
                data.shorturl
            );

            saveToHistory(
                originalUrl,
                data.shorturl
            );

        } else {

            throw new Error(
                data.errormessage || "Unable to shorten URL"
            );
        }

    } catch (error) {

        console.error(error);

        errorMessage.textContent =
            "Unable to shorten the URL. Please try again.";

    } finally {

        shortenBtn.disabled = false;
        shortenBtn.textContent = "Shorten URL";
    }

});


// Display result
function displayResult(originalUrl, shortenedUrl) {

    shortUrl.value = shortenedUrl;

    openLink.href = shortenedUrl;

    resultBox.classList.remove("hidden");
}


// Copy main shortened URL
copyBtn.addEventListener("click", async function () {

    try {

        await navigator.clipboard.writeText(
            shortUrl.value
        );

        copyBtn.textContent = "✓ Copied!";

        setTimeout(() => {
            copyBtn.textContent = "📋 Copy";
        }, 1500);

    } catch (error) {

        shortUrl.select();
        document.execCommand("copy");

        copyBtn.textContent = "✓ Copied!";

        setTimeout(() => {
            copyBtn.textContent = "📋 Copy";
        }, 1500);
    }

});


// Get history
function getHistory() {

    return JSON.parse(
        localStorage.getItem("urlHistory")
    ) || [];
}


// Save URL to history
function saveToHistory(originalUrl, shortenedUrl) {

    let history = getHistory();

    const newItem = {
        original: originalUrl,
        short: shortenedUrl,
        date: new Date().toLocaleString()
    };

    history.unshift(newItem);

    // Keep only latest 10
    history = history.slice(0, 10);

    localStorage.setItem(
        "urlHistory",
        JSON.stringify(history)
    );

    loadHistory();
}


// Display history
function loadHistory() {

    const history = getHistory();

    if (history.length === 0) {

        historyList.innerHTML = `
            <div class="empty-history">
                <span>🕘</span>
                <p>No shortened links yet.</p>
            </div>
        `;

        return;
    }

    historyList.innerHTML = "";

    history.forEach((item, index) => {

        const historyItem =
            document.createElement("div");

        historyItem.className = "history-item";

        historyItem.innerHTML = `
            <div class="history-info">

                <div class="history-original">
                    ${escapeHTML(item.original)}
                </div>

                <a
                    class="history-short"
                    href="${item.short}"
                    target="_blank"
                >
                    ${escapeHTML(item.short)}
                </a>

                <small>
                    ${escapeHTML(item.date)}
                </small>

            </div>

            <div class="history-actions">

                <button
                    class="copy-history"
                    data-index="${index}"
                >
                    📋 Copy
                </button>

                <button
                    class="open-history"
                    data-url="${item.short}"
                >
                    ↗ Open
                </button>

            </div>
        `;

        historyList.appendChild(historyItem);
    });
}


// History button actions
historyList.addEventListener("click", async function (event) {

    // Copy
    if (event.target.classList.contains("copy-history")) {

        const index =
            event.target.dataset.index;

        const history = getHistory();

        try {

            await navigator.clipboard.writeText(
                history[index].short
            );

            event.target.textContent = "✓ Copied!";

            setTimeout(() => {
                event.target.textContent = "📋 Copy";
            }, 1500);

        } catch (error) {

            alert("Unable to copy link.");
        }
    }


    // Open
    if (event.target.classList.contains("open-history")) {

        const url =
            event.target.dataset.url;

        window.open(url, "_blank");
    }

});


// Clear history
clearHistoryBtn.addEventListener("click", function () {

    const history = getHistory();

    if (history.length === 0) {
        return;
    }

    const confirmClear =
        confirm("Clear all shortened URL history?");

    if (confirmClear) {

        localStorage.removeItem("urlHistory");

        loadHistory();
    }

});


// Prevent HTML injection in displayed text
function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}