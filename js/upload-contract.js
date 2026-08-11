// ============================================================
// UPLOAD-CONTRACT.JS
// Handles picking a PDF (by click or drag & drop), showing a
// preview of it, and "analyzing" it (right now that just means
// saving it to localStorage - there's no real backend yet).
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");

    // user picked a file through the "Choose File" button
    fileInput.addEventListener("change", () => {
        if (fileInput.files[0]) {
            handleFile(fileInput.files[0]);
        }
    });

    // drag & drop support
    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault(); // needed or the browser won't allow dropping
        dropZone.classList.add("dragging");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragging");
    });

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");

        const file = event.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    });
});

function handleFile(file) {
    const preview = document.getElementById("filePreview");

    // only PDFs are supported for now
    if (file.type !== "application/pdf") {
        preview.innerHTML = `
            <div class="upload-error">
                Please upload a PDF file only.
            </div>
        `;
        return;
    }

    const sizeInMb = (file.size / 1024 / 1024).toFixed(2);

    preview.innerHTML = `
        <div class="selected-file">
            <div class="file-row">
                <div class="file-icon">PDF</div>

                <div class="file-details">
                    <strong>${safe(file.name)}</strong>
                    <span>${sizeInMb} MB</span>
                </div>

                <button class="remove-file" type="button" onclick="removeFile()">×</button>
            </div>

            <button class="btn btn-primary analyze-button" type="button" onclick="analyzeContract()">
                Analyze Contract
            </button>
        </div>
    `;
}

function removeFile() {
    document.getElementById("fileInput").value = "";
    document.getElementById("filePreview").innerHTML = "";
}

function analyzeContract() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    // grab whatever contracts already exist, add this new one, save it back
    const contracts = JSON.parse(localStorage.getItem("contracts") || "[]");

    const newContract = {
        id: Date.now(),
        name: file.name,
        date: new Date().toLocaleDateString(),
        status: "Analyzed",
        risk: "Pending", // no real AI analysis yet, so this stays "Pending"
    };

    contracts.push(newContract);
    localStorage.setItem("contracts", JSON.stringify(contracts));

    // remember which one was just uploaded, in case "My Contracts" wants to highlight it
    localStorage.setItem("selectedContract", JSON.stringify(newContract));

    window.location.href = "my-contracts.html";
}

// escapes text before inserting it into HTML, so a filename
// can't accidentally break the page or inject a script
function safe(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
