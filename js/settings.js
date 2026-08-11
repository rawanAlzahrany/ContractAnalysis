// ============================================================
// SETTINGS.JS
// Loads the saved profile into the form when the page opens,
// and saves it back to localStorage when the form is submitted.
// ============================================================

// every input on the form, matched up with its localStorage key
const PROFILE_FIELDS = [
    "fullName",
    "email",
    "phone",
    "jobTitle",
    "company",
    "department",
    "role",
    "employeeId",
];

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();

    document.getElementById("profileForm").addEventListener("submit", saveProfile);
    document.getElementById("resetProfile").addEventListener("click", resetProfile);
});

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");

    PROFILE_FIELDS.forEach((field) => {
        const element = document.getElementById(field);
        if (element && profile[field]) {
            element.value = profile[field];
        }
    });

    if (profile.notifications !== undefined) {
        document.getElementById("notifications").checked = profile.notifications;
    }
}

function saveProfile(event) {
    event.preventDefault(); // stop the form from actually submitting/reloading the page

    const profile = {};

    PROFILE_FIELDS.forEach((field) => {
        profile[field] = document.getElementById(field).value.trim();
    });

    profile.notifications = document.getElementById("notifications").checked;

    localStorage.setItem("profile", JSON.stringify(profile));

    // flash the "saved" message for a couple seconds
    const saveMessage = document.getElementById("saveMessage");
    saveMessage.style.display = "block";
    setTimeout(() => {
        saveMessage.style.display = "none";
    }, 2500);

    // update the name/avatar in the header right away, no reload needed
    if (typeof loadUserData === "function") {
        loadUserData();
    }
}

function resetProfile() {
    localStorage.removeItem("profile");
    location.reload();
}
