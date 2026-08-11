// ============================================================
// DASHBOARD.JS
// Reads the contracts saved in localStorage and uses them to
// fill in the KPI numbers + the "Recent Contracts" list.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const contracts = getContracts();
    updateKpis(contracts);
    renderRecentContracts(contracts);
});

// grabs the contracts array we saved in localStorage
// (an empty array if nothing has been uploaded yet)
function getContracts() {
    return JSON.parse(localStorage.getItem("contracts") || "[]");
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

    // newest contracts first, only show the last 5
    const recent = contracts.slice().reverse().slice(0, 5);

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
