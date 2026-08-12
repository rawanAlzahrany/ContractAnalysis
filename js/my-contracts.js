// ============================================================
// MY-CONTRACTS.JS
// Shows the list of uploaded contracts, lets you search/filter
// them, and shows a details panel when you click "View".
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    renderContracts();

    document.getElementById("searchInput").addEventListener("input", renderContracts);
    document.getElementById("riskFilter").addEventListener("change", renderContracts);

    document.getElementById("closeDetails").addEventListener("click", () => {
        document.getElementById("contractDetails").style.display = "none";
    });
});

function getContracts() {
    return JSON.parse(localStorage.getItem("contracts") || "[]");
}

function renderContracts() {
    const list = document.getElementById("contractsList");
    const search = document.getElementById("searchInput").value.toLowerCase();
    const riskFilter = document.getElementById("riskFilter").value;

    // filter down to only the contracts that match the search box + dropdown
    let contracts = getContracts().filter((contract) => {
        const matchesSearch = contract.name.toLowerCase().includes(search);
        const matchesRisk = riskFilter === "all" || contract.risk === riskFilter;
        return matchesSearch && matchesRisk;
    });

    if (contracts.length === 0) {
        list.innerHTML = `
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">▤</div>
                    <h3>No contracts found</h3>
                    <p>Upload a contract to see it here.</p>
                </div>
            </div>
        `;
        return;
    }

    list.innerHTML = "";

    // newest first
    contracts.slice().reverse().forEach((contract) => {
        const row = document.createElement("div");
        row.className = "contract-row";

        const riskClass = riskToStatusClass(contract.risk);

        row.innerHTML = `
            <div class="contract-file-icon">PDF</div>

            <div class="contract-row-info">
                <strong>${safe(contract.name)}</strong>
                <span>Uploaded ${safe(contract.date)}</span>
            </div>

            <span class="status ${riskClass}">${safe(contract.risk || "Pending")}</span>

            <div class="contract-actions">
                <button class="view-contract" data-id="${contract.id}">View</button>
            </div>
        `;

        row.querySelector(".view-contract").addEventListener("click", () => showDetails(contract));

        list.appendChild(row);
    });
}

function showDetails(contract) {
    document.getElementById("contractDetails").style.display = "block";
    document.getElementById("detailsName").textContent = contract.name;
    document.getElementById("detailsStatus").textContent = contract.status || "Pending";
    document.getElementById("detailsRisk").textContent = contract.risk || "Pending";
    document.getElementById("detailsDate").textContent = contract.date || "—";

    document.getElementById("contractDetails").scrollIntoView({ behavior: "smooth" });
}

function riskToStatusClass(risk) {
    if (risk === "High") return "status-red";
    if (risk === "Medium") return "status-orange";
    return "status-green";
}

function safe(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
