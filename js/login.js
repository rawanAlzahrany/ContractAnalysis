// ============================================================
// LOGIN.JS
// Sends whatever's in the email/password fields to the Flask
// backend, and either shows an error or logs the person in.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".login-btn").addEventListener("click", handleLogin);
});

async function handleLogin() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const messageEl = document.getElementById("formMessage");

    if (!email || !password) {
        showMessage(messageEl, "Please fill in both fields.");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // the backend sends back {"error": "..."} when something's wrong
            showMessage(messageEl, data.error);
            return;
        }

        // save who's logged in, using the same "profile" key the rest
        // of the app already reads from (see settings.js / global.js)
        localStorage.setItem(
            "profile",
            JSON.stringify({ fullName: data.user.full_name, email: data.user.email })
        );

        window.location.href = "dashboard.html";

    } catch (error) {
        // this runs if the backend isn't even reachable (e.g. Flask
        // server isn't running, or wrong URL/port)
        showMessage(messageEl, "Could not reach the server. Is the backend running?");
    }
}

function showMessage(el, text) {
    el.textContent = text;
    el.style.display = "block";
}

function togglePassword() {
    const input = document.getElementById("password");

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}