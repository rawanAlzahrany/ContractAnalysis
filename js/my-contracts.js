// ============================================================
// MY-CONTRACTS.JS
// Displays uploaded contracts, allows search/filter,
// opens the AI Review Report, and opens the original PDF.
// ============================================================


// ============================================================
// DEMO CONTRACTS
// Temporary data for testing.
// ============================================================

const demoContracts = [

    {
        id: 1,

        name: "Construction Agreement.pdf",

        date: "August 11, 2026",

        status: "Analyzed",

        risk: "Low",

        score: 25,

        completeness: 92,

        highRisk: 7,

        mediumRisk: 8,

        lowRisk: 13,

        totalClauses: 28,

        reviewedBy: "Jana Khalid",

        // PDF path will be added when upload is connected
        fileUrl: null
    },


    {
        id: 2,

        name: "Energy Supply Contract.pdf",

        date: "August 10, 2026",

        status: "Analyzed",

        risk: "Medium",

        score: 55,

        completeness: 86,

        highRisk: 4,

        mediumRisk: 10,

        lowRisk: 8,

        totalClauses: 22,

        reviewedBy: "Jana Khalid",

        fileUrl: null
    },


    {
        id: 3,

        name: "Maintenance Services Agreement.pdf",

        date: "August 8, 2026",

        status: "Analyzed",

        risk: "High",

        score: 78,

        completeness: 74,

        highRisk: 9,

        mediumRisk: 6,

        lowRisk: 5,

        totalClauses: 20,

        reviewedBy: "Jana Khalid",

        fileUrl: null
    }

];


// ============================================================
// ADD DEMO DATA ONLY IF CONTRACTS DO NOT EXIST
// ============================================================

if (!localStorage.getItem("contracts")) {

    localStorage.setItem(
        "contracts",
        JSON.stringify(demoContracts)
    );

}


// ============================================================
// PAGE START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderContracts();


        // SEARCH
        document
            .getElementById("searchInput")
            .addEventListener(
                "input",
                renderContracts
            );


        // RISK FILTER
        document
            .getElementById("riskFilter")
            .addEventListener(
                "change",
                renderContracts
            );

    }
);


// ============================================================
// GET CONTRACTS
// ============================================================

function getContracts() {

    return JSON.parse(
        localStorage.getItem("contracts") || "[]"
    );

}


// ============================================================
// RENDER CONTRACTS
// ============================================================

function renderContracts() {

    const list =
        document.getElementById(
            "contractsList"
        );


    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase();


    const riskFilter =
        document
            .getElementById(
                "riskFilter"
            )
            .value;


    // ========================================================
    // FILTER CONTRACTS
    // ========================================================

    const contracts =
        getContracts()
            .filter(
                (contract) => {

                    const contractName =
                        contract.name || "";


                    const matchesSearch =
                        contractName
                            .toLowerCase()
                            .includes(search);


                    const matchesRisk =
                        riskFilter === "all" ||
                        contract.risk === riskFilter;


                    return (
                        matchesSearch &&
                        matchesRisk
                    );

                }
            );


    // ========================================================
    // NO CONTRACTS
    // ========================================================

    if (contracts.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ▤
                </div>

                <h3>
                    No contracts found
                </h3>

                <p>
                    Upload a contract to see it here.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = "";


    // ========================================================
    // SHOW NEWEST FIRST
    // ========================================================

    contracts
        .slice()
        .reverse()
        .forEach(
            (contract) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "contract-row";


                const riskClass =
                    riskToStatusClass(
                        contract.risk
                    );


                row.innerHTML = `

                    <!-- CONTRACT -->

                    <div class="contract-name-cell">

                        <div class="contract-file-icon">
                            PDF
                        </div>


                        <div class="contract-row-info">

                            <strong>
                                ${safe(contract.name)}
                            </strong>

                        </div>

                    </div>


                    <!-- UPLOADED ON -->

                    <span class="contract-date">

                        ${safe(contract.date)}

                    </span>


                    <!-- RISK -->

                    <span
                        class="status ${riskClass}"
                    >

                        ${safe(
                    contract.risk ||
                    "Pending"
                )}

                    </span>


                    <!-- AI ANSWER -->

                    <button
                        class="view-answer"
                        type="button"
                        data-id="${contract.id}"
                    >

                        View Answer

                    </button>


                    <!-- ORIGINAL PDF -->

                    <button
                        class="view-contract"
                        type="button"
                        data-id="${contract.id}"
                    >

                        View

                    </button>

                `;


                // =================================================
                // VIEW ANSWER
                // Opens SANAD Review Report
                // =================================================

                row
                    .querySelector(
                        ".view-answer"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            openReviewReport(
                                contract
                            );

                        }
                    );


                // =================================================
                // VIEW ORIGINAL PDF
                // =================================================

                row
                    .querySelector(
                        ".view-contract"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            openContractFile(
                                contract
                            );

                        }
                    );


                list.appendChild(
                    row
                );

            }
        );

}


// ============================================================
// OPEN REVIEW REPORT
// ============================================================

function openReviewReport(
    contract
) {

    // Save selected contract
    localStorage.setItem(
        "selectedContract",
        JSON.stringify(contract)
    );


    // Open Review Report
    window.location.href =
        "review-report.html";

}


// ============================================================
// OPEN ORIGINAL PDF
// ============================================================

function openContractFile(
    contract
) {

    /*
       When Upload Contract is connected,
       each contract will have fileUrl.
    */

    if (!contract.fileUrl) {

        alert(
            "Contract PDF file is not available."
        );

        return;

    }


    // Open PDF in a new browser tab
    window.open(
        contract.fileUrl,
        "_blank"
    );

}


// ============================================================
// RISK COLOR CLASS
// ============================================================

function riskToStatusClass(
    risk
) {

    if (risk === "High") {

        return "status-red";

    }


    if (risk === "Medium") {

        return "status-orange";

    }


    if (risk === "Low") {

        return "status-green";

    }


    return "status-green";

}


// ============================================================
// SAFE HTML
// ============================================================

function safe(
    value
) {

    return String(
        value || ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}