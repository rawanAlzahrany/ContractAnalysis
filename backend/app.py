# ============================================================
# app.py
#
# Flask server for the Contract Analyzer application.
#
# Routes:
#   POST /signup          -> starts signup, sends OTP, does NOT
#                             create the user yet
#   POST /verify-otp      -> checks the code, creates the user
#   POST /resend-otp      -> sends a new code for a pending signup
#   POST /login
#   GET  /user/<id>
#   PUT  /user/<id>
#   POST /contracts
#   GET  /contracts
#   GET  /contracts/<id>
#   GET  /contracts/<id>/file
# ============================================================

import os
import random
import time

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from models import db, User, Contract
from auth import hash_password, verify_password
from mail_utils import generate_otp, send_otp_email
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
# UPLOAD FOLDER
# ============================================================

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB max per upload


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

with app.app_context():
    db.create_all()


# ============================================================
# PENDING SIGNUPS (OTP STORAGE)
#
# Nobody is written to MySQL until their OTP is verified.
# While they wait, we hold their signup details here in memory,
# keyed by email.
#
# IMPORTANT:
# This dictionary lives only in RAM. If you restart the Flask
# server, anyone who hasn't verified yet will need to sign up
# again. That's fine for a class project; a real product would
# use a database table or Redis instead.
#
# Shape of each entry:
# {
#   "otp": "123456",
#   "expires_at": <unix timestamp>,
#   "full_name": ..., "email": ..., "password_hash": ...,
#   "phone_number": ..., "job_title": ..., "company": ...,
#   "department": ..., "employee_id": ..., "role": ...,
# }
# ============================================================

pending_signups = {}

OTP_TTL_SECONDS = 10 * 60  # 10 minutes


# ============================================================
# SIGNUP  (step 1: validate + send OTP)
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
    # CHECK EMAIL (already a real account)
    # ========================================================

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "error": "An account with this email already exists."
        }), 409


    # ========================================================
    # CHECK EMPLOYEE ID (already a real account)
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
    # GENERATE + SEND OTP
    # ========================================================

    otp_code = generate_otp()

    email_sent = send_otp_email(email, otp_code)

    if not email_sent:
        return jsonify({
            "error": "Could not send verification email. Please try again."
        }), 500


    # ========================================================
    # STASH THE PENDING SIGNUP
    #
    # Overwrites any previous pending signup for this email -
    # e.g. if they click "Sign up" twice, only the latest OTP
    # is valid.
    # ========================================================

    pending_signups[email] = {
        "otp": otp_code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
        "full_name": full_name,
        "email": email,
        "password_hash": hash_password(password),
        "phone_number": phone_number or None,
        "job_title": job_title or None,
        "company": company or None,
        "department": department or None,
        "employee_id": employee_id or None,
        "role": role,
    }

    return jsonify({
        "message": "Verification code sent to your email.",
        "email": email
    }), 200


# ============================================================
# VERIFY OTP  (step 2: check code, create the real user)
# ============================================================

@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    otp_code = data.get("otp", "").strip()

    if not email or not otp_code:
        return jsonify({
            "error": "Email and code are required."
        }), 400

    pending = pending_signups.get(email)

    if not pending:
        return jsonify({
            "error": "No pending signup found for this email. Please sign up again."
        }), 404

    if time.time() > pending["expires_at"]:
        del pending_signups[email]
        return jsonify({
            "error": "This code has expired. Please sign up again."
        }), 400

    if otp_code != pending["otp"]:
        return jsonify({
            "error": "Incorrect code."
        }), 400


    # ========================================================
    # CODE IS CORRECT - CREATE THE REAL USER NOW
    # ========================================================

    # Double check nobody grabbed this email while they waited
    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        del pending_signups[email]
        return jsonify({
            "error": "An account with this email already exists."
        }), 409

    new_user = User(
        full_name=pending["full_name"],
        email=pending["email"],
        phone_number=pending["phone_number"],
        job_title=pending["job_title"],
        company=pending["company"],
        department=pending["department"],
        employee_id=pending["employee_id"],
        role=pending["role"],
        password_hash=pending["password_hash"],
    )

    db.session.add(new_user)
    db.session.commit()

    # Done with the pending entry
    del pending_signups[email]

    return jsonify({
        "message": "Account created.",
        "user": new_user.to_dict()
    }), 201


# ============================================================
# RESEND OTP
# ============================================================

@app.route("/resend-otp", methods=["POST"])
def resend_otp():

    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    pending = pending_signups.get(email)

    if not pending:
        return jsonify({
            "error": "No pending signup found for this email. Please sign up again."
        }), 404

    new_otp = generate_otp()

    email_sent = send_otp_email(email, new_otp)

    if not email_sent:
        return jsonify({
            "error": "Could not send verification email. Please try again."
        }), 500

    pending["otp"] = new_otp
    pending["expires_at"] = time.time() + OTP_TTL_SECONDS

    return jsonify({
        "message": "A new code has been sent."
    }), 200


# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")


    user = User.query.filter_by(email=email).first()


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
# ============================================================

@app.route("/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found."
        }), 404

    data = request.get_json() or {}

    full_name = data.get("full_name")
    email = data.get("email")
    phone_number = data.get("phone_number")
    job_title = data.get("job_title")
    company = data.get("company")
    department = data.get("department")
    employee_id = data.get("employee_id")

    if full_name is not None:

        full_name = full_name.strip()

        if not full_name:
            return jsonify({
                "error": "Full name cannot be empty."
            }), 400

        user.full_name = full_name

    if email is not None:

        email = email.strip().lower()

        if not email:
            return jsonify({
                "error": "Email cannot be empty."
            }), 400

        existing_user = User.query.filter(
            User.email == email,
            User.id != user.id
        ).first()

        if existing_user:
            return jsonify({
                "error": "An account with this email already exists."
            }), 409

        user.email = email

    if phone_number is not None:
        user.phone_number = phone_number.strip() or None

    if job_title is not None:
        user.job_title = job_title.strip() or None

    if company is not None:
        user.company = company.strip() or None

    if department is not None:
        user.department = department.strip() or None

    if employee_id is not None:

        employee_id = employee_id.strip()

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

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully.",
        "user": user.to_dict()
    }), 200


# ============================================================
# UPLOAD CONTRACT
# ============================================================

def generate_placeholder_analysis():

    total_clauses = random.randint(15, 30)
    high = random.randint(1, 8)
    medium = random.randint(2, 10)
    low = max(total_clauses - high - medium, 1)

    score = min(100, high * 8 + medium * 3)

    if score >= 70:
        risk = "High"
    elif score >= 40:
        risk = "Medium"
    else:
        risk = "Low"

    completeness = random.randint(70, 98)

    return {
        "total_clauses": total_clauses,
        "high": high,
        "medium": medium,
        "low": low,
        "score": score,
        "risk": risk,
        "completeness": completeness,
    }


@app.route("/contracts", methods=["POST"])
def upload_contract():

    user_id = request.form.get("user_id")
    file = request.files.get("file")

    if not user_id:
        return jsonify({
            "error": "user_id is required."
        }), 400

    user = db.session.get(User, user_id)

    if not user:
        return jsonify({
            "error": "User not found."
        }), 404

    if not file or file.filename == "":
        return jsonify({
            "error": "No file uploaded."
        }), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({
            "error": "Only PDF files are supported."
        }), 400

    original_filename = secure_filename(file.filename)
    unique_filename = f"{user_id}_{int(random.random() * 1_000_000)}_{original_filename}"

    save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)
    file.save(save_path)

    analysis = generate_placeholder_analysis()

    new_contract = Contract(
        user_id=user.id,
        name=original_filename,
        file_path=unique_filename,
        status="Analyzed",
        risk=analysis["risk"],
        score=analysis["score"],
        completeness=analysis["completeness"],
        high_risk=analysis["high"],
        medium_risk=analysis["medium"],
        low_risk=analysis["low"],
        total_clauses=analysis["total_clauses"],
    )

    db.session.add(new_contract)
    db.session.commit()

    return jsonify({
        "message": "Contract uploaded.",
        "contract": new_contract.to_dict()
    }), 201


# ============================================================
# LIST CONTRACTS
# ============================================================

@app.route("/contracts", methods=["GET"])
def list_contracts():

    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({
            "error": "user_id is required."
        }), 400

    contracts = (
        Contract.query
        .filter_by(user_id=user_id)
        .order_by(Contract.created_at.desc())
        .all()
    )

    return jsonify({
        "contracts": [contract.to_dict() for contract in contracts]
    }), 200


# ============================================================
# GET SINGLE CONTRACT
# ============================================================

@app.route("/contracts/<int:contract_id>", methods=["GET"])
def get_contract(contract_id):

    contract = db.session.get(Contract, contract_id)

    if not contract:
        return jsonify({
            "error": "Contract not found."
        }), 404

    return jsonify({
        "contract": contract.to_dict()
    }), 200


# ============================================================
# DOWNLOAD/VIEW ORIGINAL CONTRACT FILE
# ============================================================

@app.route("/contracts/<int:contract_id>/file", methods=["GET"])
def get_contract_file(contract_id):

    contract = db.session.get(Contract, contract_id)

    if not contract or not contract.file_path:
        return jsonify({
            "error": "File not found."
        }), 404

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        contract.file_path
    )


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    app.run(debug=True)