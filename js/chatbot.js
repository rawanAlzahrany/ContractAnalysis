// ============================================================
// CHATBOT.JS
// A simple keyword-based fake chatbot. Real AI responses would
// come from a backend API - for now this just pattern-matches
// on a few keywords so the UI has something to show.
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("chatInput");
    const sendButton = document.getElementById("sendMessage");

    sendButton.addEventListener("click", sendMessage);

    // let Enter send the message, but Shift+Enter still makes a new line
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // clicking a quick-prompt button fills the box and sends it right away
    document.querySelectorAll(".quick-prompts button").forEach((button) => {
        button.addEventListener("click", () => {
            input.value = button.dataset.prompt;
            sendMessage();
        });
    });

    document.getElementById("newChat").addEventListener("click", newChat);
});

function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";

    // small delay just so it doesn't feel instant/robotic
    setTimeout(() => {
        addMessage("assistant", generateResponse(text));
    }, 500);
}

function addMessage(type, text) {
    const messages = document.getElementById("messages");
    const message = document.createElement("div");

    message.className = type === "user" ? "message user-message" : "message";

    message.innerHTML = `
        <div class="message-avatar">${type === "user" ? "T" : "AI"}</div>
        <div>
            <span class="message-label">${type === "user" ? "You" : "Contract Assistant"}</span>
            <div class="bubble">${safe(text)}</div>
        </div>
    `;

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight; // auto-scroll to the newest message
}

// picks a canned response based on keywords in the question
function generateResponse(text) {
    const value = text.toLowerCase();

    if (value.includes("summar")) {
        return "The contract summary will be generated from the uploaded document once the AI analysis API is connected.";
    }

    if (value.includes("risk")) {
        return "The system will evaluate potential risks such as unclear obligations, termination conditions, penalties, missing clauses and important dates.";
    }

    if (value.includes("missing") || value.includes("clause")) {
        return "I can identify missing or incomplete clauses by comparing the contract against the required contract structure.";
    }

    return "I received your question. The contract-specific AI response will be connected to the backend analysis service.";
}

function newChat() {
    document.getElementById("messages").innerHTML = `
        <div class="message">
            <div class="message-avatar">AI</div>
            <div>
                <span class="message-label">Contract Assistant</span>
                <div class="bubble">Hello! How can I help you with your contract?</div>
            </div>
        </div>
    `;
}

function safe(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
