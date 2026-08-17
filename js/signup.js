// ============================================================
// SIGNUP.JS
// Sends the name/email/password to the Flask backend, which
// now sends an OTP instead of creating the account right away.
// We save the email and send the user to verify.html to enter
// the code.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".signup-btn").addEventListener("click", handleSignup);
});

async function handleSignup() {
    const fullName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const messageEl = document.getElementById("formMessage");

    if (!fullName || !email || !password || !confirmPassword) {
        showMessage(messageEl, "Please fill in every field.");
        return;
    }

    if (password !== confirmPassword) {
        showMessage(messageEl, "Passwords don't match.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(messageEl, data.error);
            return;
        }

        // OTP sent - remember the email and go enter the code
        sessionStorage.setItem("pendingSignupEmail", email);
        window.location.href = "verify.html";

    } catch (error) {
        showMessage(messageEl, "Could not reach the server. Is the backend running?");
    }
}

function showMessage(el, text) {
    el.textContent = text;
    el.style.display = "block";
}

function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}