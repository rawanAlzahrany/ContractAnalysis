// ============================================================
// SETTINGS.JS
// Loads the saved profile into the form when the page opens,
// and saves it back to localStorage when the form is submitted.
// ============================================================

// Every editable profile field, matched with its localStorage key
const PROFILE_FIELDS = [
    "fullName",
    "email",
    "phone",
    "jobTitle",
    "company",
    "department",
    "employeeId",
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
// LOAD PROFILE
// Gets the saved profile from localStorage and puts the
// information back into the form.
// ============================================================

function loadProfile() {

    const profile = JSON.parse(
        localStorage.getItem("profile") || "{}"
    );

    PROFILE_FIELDS.forEach((field) => {

        const element = document.getElementById(field);

        if (element && profile[field] !== undefined) {
            element.value = profile[field];
        }

    });


    // Load notification preference
    if (profile.notifications !== undefined) {

        document.getElementById("notifications").checked =
            profile.notifications;

    }
}


// ============================================================
// SAVE PROFILE
// Saves the profile information to localStorage when the user
// clicks "Save Changes".
// ============================================================

function saveProfile(event) {

    // Prevent the page from refreshing
    event.preventDefault();

    const profile = {};


    // Get all profile fields
    PROFILE_FIELDS.forEach((field) => {

        const element = document.getElementById(field);

        if (element) {
            profile[field] = element.value.trim();
        }

    });


    // Save notification preference
    profile.notifications =
        document.getElementById("notifications").checked;


    // Save profile to localStorage
    localStorage.setItem(
        "profile",
        JSON.stringify(profile)
    );


    // ========================================================
    // SHOW SUCCESS MESSAGE
    // ========================================================

    const saveMessage =
        document.getElementById("saveMessage");

    saveMessage.style.display = "block";


    // Hide message after 2.5 seconds
    setTimeout(() => {

        saveMessage.style.display = "none";

    }, 2500);


    // ========================================================
    // UPDATE HEADER
    // Updates the username/avatar without refreshing the page
    // ========================================================

    if (typeof loadUserData === "function") {
        loadUserData();
    }

}


// ============================================================
// RESET PROFILE
// Removes the saved profile from localStorage and reloads
// the page so the fields return to their default state.
// ============================================================

function resetProfile() {

    localStorage.removeItem("profile");

    location.reload();

}