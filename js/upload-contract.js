// ============================================================
// UPLOAD-CONTRACT.JS
// Handles picking a PDF (by click or drag & drop), showing a
// preview of it, and sending it to the Flask backend to be
// saved and "analyzed" (see app.py for how the placeholder
// analysis numbers are generated).
// ============================================================

const API_BASE = "http://127.0.0.1:5000";

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

async function analyzeContract() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    const profile = JSON.parse(localStorage.getItem("profile") || "{}");

    if (!profile.id) {
        showUploadError("You need to be logged in to upload a contract.");
        return;
    }

    const analyzeButton = document.querySelector(".analyze-button");
    if (analyzeButton) {
        analyzeButton.disabled = true;
        analyzeButton.textContent = "Analyzing...";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", profile.id);

    try {
        const response = await fetch(`${API_BASE}/contracts`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            showUploadError(data.error || "Could not upload the contract.");
            resetAnalyzeButton(analyzeButton);
            return;
        }

        // remember which one was just uploaded, so "My Contracts"
        // can open its review report right away without re-fetching
        localStorage.setItem("selectedContract", JSON.stringify(data.contract));

        window.location.href = "my-contracts.html";

    } catch (error) {
        showUploadError("Could not reach the server. Is the backend running?");
        resetAnalyzeButton(analyzeButton);
    }
}

function resetAnalyzeButton(analyzeButton) {
    if (analyzeButton) {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Contract";
    }
}

function showUploadError(text) {
    const preview = document.getElementById("filePreview");

    const existingError = preview.querySelector(".upload-error");
    if (existingError) existingError.remove();

    const errorDiv = document.createElement("div");
    errorDiv.className = "upload-error";
    errorDiv.textContent = text;

    preview.appendChild(errorDiv);
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