# ============================================================
# test_chatbot.py
#
# A minimal, standalone version of the chatbot route — for
# testing ONLY. It does not touch the database, models, or
# auth at all, so you don't need MySQL running to try this out.
#
# Run it with:  python test_chatbot.py
# Then open:    http://127.0.0.1:5000/chat  (in a tool like
#               the browser console, or just keep reading below
#               for a simple way to test it from the terminal)
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS

from chatbot import generate_response

app = Flask(__name__)
CORS(app)


@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json() or {}

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Message is required."
        }), 400

    reply = generate_response(message)

    return jsonify({
        "reply": reply
    }), 200


# A super simple homepage just so you can tell the server is running
# by visiting http://127.0.0.1:5000 in your browser.
@app.route("/")
def home():
    return "Chatbot test server is running! POST to /chat to try it."


app.run(debug=True, port=5001)
