// ============================================================
// VERIFY.JS
// Reads the email that signup.js saved, sends the OTP the user
// types in to /verify-otp, and on success creates the account
// and sends them to login.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const email = sessionStorage.getItem("pendingSignupEmail");
    const descriptionEl = document.getElementById("verify-description");

    if (email) {
        descriptionEl.textContent = `We sent a 6-digit code to ${email}.`;
    } else {
        // no pending signup - send them back to sign up
        window.location.href = "signup.html";
    }

    document.getElementById("verify-btn").addEventListener("click", handleVerify);
    document.getElementById("resend-link").addEventListener("click", handleResend);
});

async function handleVerify() {
    const email = sessionStorage.getItem("pendingSignupEmail");
    const otp = document.getElementById("otp").value.trim();
    const messageEl = document.getElementById("formMessage");

    if (!otp) {
        showMessage(messageEl, "Please enter the code.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(messageEl, data.error);
            return;
        }

        // account created - clean up and send them to log in
        sessionStorage.removeItem("pendingSignupEmail");
        window.location.href = "login.html";

    } catch (error) {
        showMessage(messageEl, "Could not reach the server. Is the backend running?");
    }
}

async function handleResend(event) {
    event.preventDefault();

    const email = sessionStorage.getItem("pendingSignupEmail");
    const messageEl = document.getElementById("formMessage");

    try {
        const response = await fetch("http://127.0.0.1:5000/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(messageEl, data.error);
            return;
        }

        messageEl.style.color = "#19bfa6";
        showMessage(messageEl, "A new code has been sent.");

    } catch (error) {
        showMessage(messageEl, "Could not reach the server. Is the backend running?");
    }
}

function showMessage(el, text) {
    el.textContent = text;
    el.style.display = "block";
}
