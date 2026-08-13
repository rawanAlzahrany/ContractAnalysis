// ============================================================
// SETTINGS.JS
// Loads the user's profile from the backend (falling back to
// whatever's cached in localStorage if there's no logged-in id
// or the backend isn't reachable), and saves changes back to
// the database when the form is submitted.
//
// "Notifications" is not stored in the database (no column for
// it yet), so that one preference stays in localStorage only.
// ============================================================

const API_BASE = "http://127.0.0.1:5000";

// Every editable profile field: the input's id in the HTML,
// and the matching key the backend uses (snake_case).
const PROFILE_FIELDS = [
    { id: "fullName", key: "full_name" },
    { id: "email", key: "email" },
    { id: "phone", key: "phone_number" },
    { id: "jobTitle", key: "job_title" },
    { id: "company", key: "company" },
    { id: "department", key: "department" },
    { id: "employeeId", key: "employee_id" },
];


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

    document
        .getElementById("profileForm")
        .addEventListener("submit", saveProfile);

    document
        .getElementById("resetProfile")
        .addEventListener("click", resetProfile);

});


// ============================================================
// GET SAVED USER ID
// Saved to localStorage by login.js when the user logs in.
// ============================================================

function getUserId() {
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    return profile.id || null;
}


// ============================================================
// LOAD PROFILE
// The backend is the source of truth. If there's no logged-in
// id, or the backend can't be reached, falls back to whatever
// was last cached locally so the form still shows something.
// ============================================================

async function loadProfile() {

    const userId = getUserId();

    if (userId) {

        try {
            const response = await fetch(`${API_BASE}/user/${userId}`);

            if (response.ok) {
                const data = await response.json();
                fillForm(data.user);
                cacheProfile(data.user);
                loadNotificationPreference();
                return;
            }

        } catch (error) {
            // backend not reachable - fall through to the local cache below
        }
    }

    const cached = JSON.parse(localStorage.getItem("profile") || "{}");

    fillForm({
        full_name: cached.fullName,
        email: cached.email,
        phone_number: cached.phone,
        job_title: cached.jobTitle,
        company: cached.company,
        department: cached.department,
        employee_id: cached.employeeId,
    });

    loadNotificationPreference();
}

function fillForm(user) {
    PROFILE_FIELDS.forEach(({ id, key }) => {
        const element = document.getElementById(id);
        if (element && user[key] !== undefined && user[key] !== null) {
            element.value = user[key];
        }
    });
}

function loadNotificationPreference() {
    const cached = JSON.parse(localStorage.getItem("profile") || "{}");
    if (cached.notifications !== undefined) {
        document.getElementById("notifications").checked = cached.notifications;
    }
}


// ============================================================
// SAVE PROFILE
// Sends the updated fields to the backend (PUT /user/<id>).
// Notifications is saved to localStorage only.
// ============================================================

async function saveProfile(event) {

    event.preventDefault();

    const userId = getUserId();

    const payload = {};
    PROFILE_FIELDS.forEach(({ id, key }) => {
        const element = document.getElementById(id);
        if (element) {
            payload[key] = element.value.trim();
        }
    });

    if (userId) {

        try {
            const response = await fetch(`${API_BASE}/user/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                showSaveMessage(data.error || "Could not save changes.", true);
                return;
            }

            cacheProfile(data.user);

        } catch (error) {
            showSaveMessage("Could not reach the server. Changes were not saved.", true);
            return;
        }

    } else {
        // no logged-in user id - just keep the form's values cached locally
        cacheProfile({
            full_name: payload.full_name,
            email: payload.email,
            phone_number: payload.phone_number,
            job_title: payload.job_title,
            company: payload.company,
            department: payload.department,
            employee_id: payload.employee_id,
        });
    }

    // Notifications preference stays local-only
    const cached = JSON.parse(localStorage.getItem("profile") || "{}");
    cached.notifications = document.getElementById("notifications").checked;
    localStorage.setItem("profile", JSON.stringify(cached));

    showSaveMessage("✓ Changes saved successfully.", false);

    // Update the header name/avatar without refreshing the page
    if (typeof loadUserData === "function") {
        loadUserData();
    }
}

function cacheProfile(user) {
    const existing = JSON.parse(localStorage.getItem("profile") || "{}");

    localStorage.setItem("profile", JSON.stringify({
        ...existing,
        id: user.id ?? existing.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        jobTitle: user.job_title,
        company: user.company,
        department: user.department,
        employeeId: user.employee_id,
    }));
}

function showSaveMessage(text, isError) {
    const saveMessage = document.getElementById("saveMessage");

    saveMessage.textContent = text;
    saveMessage.style.color = isError ? "#e84d5b" : "";
    saveMessage.style.display = "block";

    setTimeout(() => {
        saveMessage.style.display = "none";
    }, 2500);
}


// ============================================================
// RESET PROFILE
// Just reloads the page, so the form re-fetches the real saved
// profile from the backend (or cache) and any unsaved typing is
// discarded. Does NOT clear localStorage, so the user stays
// logged in.
// ============================================================

function resetProfile() {
    location.reload();
}