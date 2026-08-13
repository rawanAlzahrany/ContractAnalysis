// ============================================================
// DASHBOARD.JS
// Loads the logged-in user's contracts from the backend and
// uses them to fill in the KPI numbers + the "Recent Contracts"
// list.
// ============================================================

const API_BASE = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", async () => {
    const contracts = await getContracts();
    updateKpis(contracts);
    renderRecentContracts(contracts);
});

// fetches the logged-in user's contracts from the backend
// (an empty array if not logged in, or nothing uploaded yet)
async function getContracts() {

    const profile = JSON.parse(localStorage.getItem("profile") || "{}");

    if (!profile.id) return [];

    try {
        const response = await fetch(`${API_BASE}/contracts?user_id=${profile.id}`);
        const data = await response.json();

        return response.ok ? data.contracts : [];

    } catch (error) {
        // backend not reachable - just show empty state rather than crash
        return [];
    }
}

function updateKpis(contracts) {
    const total = contracts.length;
    const analyzed = contracts.filter(c => c.status === "Analyzed").length;
    const highRisk = contracts.filter(c => c.risk === "High").length;
    const needsReview = contracts.filter(c => c.risk === "High" || c.status === "Needs Review").length;

    document.getElementById("totalContracts").textContent = total;
    document.getElementById("analyzedContracts").textContent = analyzed;
    document.getElementById("highRisk").textContent = highRisk;
    document.getElementById("needsReview").textContent = needsReview;
}

function renderRecentContracts(contracts) {
    // nothing uploaded yet? just leave the "No contracts yet" message alone
    if (contracts.length === 0) return;

    const container = document.getElementById("recentContracts");
    container.innerHTML = "";

    // backend already returns newest first, only show the top 5
    const recent = contracts.slice(0, 5);

    recent.forEach(contract => {
        const row = document.createElement("div");
        row.className = "contract-row-mini";

        row.innerHTML = `
            <div>
                <strong>${safe(contract.name)}</strong>
                <span>${safe(contract.date || "Recently uploaded")}</span>
            </div>
            <span class="status ${riskToStatusClass(contract.risk)}">
                ${safe(contract.risk || "Pending")}
            </span>
        `;

        container.appendChild(row);
    });
}

// turns a risk level ("High"/"Medium"/"Low") into the matching status color class
function riskToStatusClass(risk) {
    if (risk === "High") return "status-red";
    if (risk === "Medium") return "status-orange";
    return "status-green";
}

// escapes text before we drop it into innerHTML, so a contract
// named something like "<script>" can't break the page
function safe(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}