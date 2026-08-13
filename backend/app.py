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
#   POST /contracts
#   GET  /contracts
#   GET  /contracts/<id>
#   GET  /contracts/<id>/file
# ============================================================

import os
import random

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from models import db, User, Contract
from auth import hash_password, verify_password


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
#
# Uploaded contract PDFs are saved here, inside the backend
# folder. This folder is created automatically if it doesn't
# exist yet.
# ============================================================

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # 20 MB max per upload


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
# UPLOAD CONTRACT
#
# Used by upload-contract.js when the user clicks
# "Analyze Contract". Saves the PDF to disk and creates a
# contract record.
#
# IMPORTANT:
# There's no real AI analysis connected yet, so the risk/score
# numbers below are placeholder values generated on upload,
# just so the UI has real numbers instead of hardcoded demo
# data. Replace generate_placeholder_analysis() once a real
# analysis service is connected.
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


    # Save the file to disk with a unique name, so two people
    # uploading "Contract.pdf" don't overwrite each other.
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
#
# Used by my-contracts.js to load a user's contracts.
#
# Example:
# GET http://127.0.0.1:5000/contracts?user_id=1
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