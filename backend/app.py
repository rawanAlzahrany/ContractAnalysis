# ============================================================
# app.py
#
# Flask server for the Contract Analyzer application.
#
# Routes:
#   POST /signup
#   POST /login
#   GET  /user/<id>
#   PUT  /user/<id>
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS

from models import db, User, ChatMessage
from auth import hash_password, verify_password
from chatbot import generate_response

# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)

# Allows the frontend HTML/JavaScript to communicate
# with this Flask backend.
CORS(app)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

app.config["SQLALCHEMY_DATABASE_URI"] = (
    "mysql+pymysql://root:Rr%4013241324@localhost/contractai"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

# During development, this creates tables that don't already
# exist.
#
# IMPORTANT:
# db.create_all() does NOT update an existing table when you
# add new columns. If your users table already exists, we will
# need to update the database separately.
#
with app.app_context():
    db.create_all()


# ============================================================
# SIGNUP
# ============================================================

@app.route("/signup", methods=["POST"])
def signup():

    data = request.get_json() or {}

    # Get basic account information
    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Get professional information
    phone_number = data.get("phone_number", "").strip()
    job_title = data.get("job_title", "").strip()
    company = data.get("company", "").strip()
    department = data.get("department", "").strip()
    employee_id = data.get("employee_id", "").strip()

    # Role is NOT taken from the frontend.
    # New users are employees by default.
    role = "employee"


    # ========================================================
    # VALIDATION
    # ========================================================

    if not full_name or not email or not password:
        return jsonify({
            "error": "Full name, email, and password are required."
        }), 400


    # ========================================================
    # CHECK EMAIL
    # ========================================================

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "An account with this email already exists."
        }), 409


    # ========================================================
    # CHECK EMPLOYEE ID
    # ========================================================

    if employee_id:

        existing_employee = User.query.filter_by(
            employee_id=employee_id
        ).first()

        if existing_employee:
            return jsonify({
                "error": "An account with this Employee ID already exists."
            }), 409


    # ========================================================
    # CREATE USER
    # ========================================================

    new_user = User(
        full_name=full_name,
        email=email,
        phone_number=phone_number or None,
        job_title=job_title or None,
        company=company or None,
        department=department or None,
        employee_id=employee_id or None,
        role=role,
        password_hash=hash_password(password),
    )


    # Save user
    db.session.add(new_user)
    db.session.commit()


    return jsonify({
        "message": "Account created.",
        "user": new_user.to_dict()
    }), 201


# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")


    # Find user by email
    user = User.query.filter_by(email=email).first()


    # Use the same error message whether the email doesn't
    # exist or the password is incorrect.
    if not user or not verify_password(
        password,
        user.password_hash
    ):

        return jsonify({
            "error": "Invalid email or password."
        }), 401


    return jsonify({
        "message": "Logged in.",
        "user": user.to_dict()
    }), 200

    # ============================================================
# CHATBOT
#
# Used by chatbot.js on the AI Assistant page.
#
# Example:
# POST http://127.0.0.1:5000/chat
# Body: { "message": "how do I upload a contract?" }
# ============================================================

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


# ============================================================
# GET USER PROFILE
#
# Used by settings.js to load the user's information.
#
# Example:
# GET http://127.0.0.1:5000/user/1
# ============================================================

@app.route("/user/<int:user_id>", methods=["GET"])
def get_user(user_id):

    user = db.session.get(User, user_id)


    if not user:
        return jsonify({
            "error": "User not found."
        }), 404


    return jsonify({
        "user": user.to_dict()
    }), 200


# ============================================================
# UPDATE USER PROFILE
#
# Used by settings.js when the user clicks "Save Changes".
#
# IMPORTANT:
# Role is intentionally NOT updated here.
# Users cannot change their own role from Settings.
# ============================================================

@app.route("/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    user = db.session.get(User, user_id)


    if not user:
        return jsonify({
            "error": "User not found."
        }), 404


    data = request.get_json() or {}


    # ========================================================
    # GET UPDATED INFORMATION
    # ========================================================

    full_name = data.get("full_name")
    email = data.get("email")
    phone_number = data.get("phone_number")
    job_title = data.get("job_title")
    company = data.get("company")
    department = data.get("department")
    employee_id = data.get("employee_id")


    # ========================================================
    # VALIDATE FULL NAME
    # ========================================================

    if full_name is not None:

        full_name = full_name.strip()

        if not full_name:
            return jsonify({
                "error": "Full name cannot be empty."
            }), 400

        user.full_name = full_name


    # ========================================================
    # VALIDATE EMAIL
    # ========================================================

    if email is not None:

        email = email.strip().lower()

        if not email:
            return jsonify({
                "error": "Email cannot be empty."
            }), 400


        # Check whether another user already has this email
        existing_user = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()


        if existing_user:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409


        user.email = email


    # ========================================================
    # UPDATE PERSONAL INFORMATION
    # ========================================================

    if phone_number is not None:
        user.phone_number = phone_number.strip() or None


    if job_title is not None:
        user.job_title = job_title.strip() or None


    # ========================================================
    # UPDATE PROFESSIONAL INFORMATION
    # ========================================================

    if company is not None:
        user.company = company.strip() or None


    if department is not None:
        user.department = department.strip() or None


    # ========================================================
    # UPDATE EMPLOYEE ID
    # ========================================================

    if employee_id is not None:

        employee_id = employee_id.strip()


        # Check whether another user already has this ID
        if employee_id:

            existing_employee = User.query.filter(
                User.employee_id == employee_id,
                User.id != user.id
            ).first()


            if existing_employee:
                return jsonify({
                    "error": "This Employee ID is already in use."
                }), 409


        user.employee_id = employee_id or None


    # ========================================================
    # SAVE CHANGES
    # ========================================================

    db.session.commit()


    return jsonify({
        "message": "Profile updated successfully.",
        "user": user.to_dict()
    }), 200


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(debug=True)