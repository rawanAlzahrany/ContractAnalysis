// ============================================================
// CHATBOT.JS
// Sends the user's message to the Flask backend (/chat) and
// shows the reply it sends back.
// ============================================================

const CHAT_API_URL = "http://127.0.0.1:5000/chat";

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

    setupScrollToBottomButton();
});

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    input.value = "";

    const typingBubble = showTyping();

    try {
        const response = await fetch(CHAT_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text }),
        });

        const data = await response.json();

        typingBubble.remove();

        if (!response.ok) {
            addMessage("assistant", data.error || "Something went wrong. Please try again.");
            return;
        }

        addMessage("assistant", data.reply);

    } catch (error) {
        typingBubble.remove();
        addMessage(
            "assistant",
            "I couldn't reach the server. Make sure the backend is running (python test_chatbot.py or python app.py), then try again."
        );
        console.error("Chat request failed:", error);
    }
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

// shows a temporary "typing..." bubble while we wait for the backend
function showTyping() {
    const messages = document.getElementById("messages");
    const message = document.createElement("div");
    message.className = "message";
    message.innerHTML = `
        <div class="message-avatar">AI</div>
        <div>
            <span class="message-label">Contract Assistant</span>
            <div class="bubble">…</div>
        </div>
    `;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
    return message;
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

// ============================================================
// SCROLL-TO-BOTTOM BUTTON
// Shows a floating button when the user scrolls up to read
// older messages, so they can jump back to the latest one.
// ============================================================
function setupScrollToBottomButton() {
    const messages = document.getElementById("messages");
    if (!messages) return;

    // Make sure the messages container can actually be scrolled
    // relative to a positioned parent (needed for the button to
    // sit correctly). If your CSS already sets position on the
    // chat card, this line is harmless.
    const chatCard = messages.closest(".chat-card") || messages.parentElement;
    if (chatCard && getComputedStyle(chatCard).position === "static") {
        chatCard.style.position = "relative";
    }

    // Inject minimal styling for the button (kept here so you
    // don't have to touch chatbot.css, but feel free to move
    // this into the CSS file instead).
    const style = document.createElement("style");
    style.textContent = `
        #scrollToBottomBtn {
            position: absolute;
            bottom: 90px;
            right: 24px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: #1e3a8a;
            color: white;
            font-size: 18px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 20;
            transition: opacity 0.2s ease;
        }
        #scrollToBottomBtn:hover {
            background: #1d4ed8;
        }
    `;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.id = "scrollToBottomBtn";
    button.type = "button";
    button.title = "Scroll to latest message";
    button.textContent = "↓";
    (chatCard || document.body).appendChild(button);

    button.addEventListener("click", () => {
        messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
    });

    // Show the button only when the user isn't near the bottom
    messages.addEventListener("scroll", () => {
        const distanceFromBottom =
            messages.scrollHeight - messages.scrollTop - messages.clientHeight;
        button.style.display = distanceFromBottom > 150 ? "flex" : "none";
    });
}
