// ============================================================
// GLOBAL.JS
// This file runs on every single page. Since the sidebar and
// header are now written directly into each HTML file (instead
// of being fetched and injected), this file just has one job
// left: fill in the user's name + avatar letter in the header,
// based on whatever they saved on the Settings page.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    loadUserData();
});

function loadUserData() {
    // profile is saved as JSON in localStorage by settings.js
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");

    const name = profile.fullName || "Contract User";
    const avatarLetter = name.charAt(0).toUpperCase();

    const nameEl = document.getElementById("userName");
    const avatarEl = document.getElementById("userAvatar");

    // not every page might have these, so check first
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = avatarLetter;
}
