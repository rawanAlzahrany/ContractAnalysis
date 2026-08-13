# ============================================================
# models.py
#
# Defines the "users" and "contracts" tables using SQLAlchemy.
# SQLAlchemy allows us to work with database tables using
# Python objects instead of writing SQL for every operation.
# ============================================================

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):

    __tablename__ = "users"

    # ========================================================
    # BASIC ACCOUNT INFORMATION
    # ========================================================

    id = db.Column(db.Integer, primary_key=True)

    full_name = db.Column(
        db.String(120),
        nullable=False
    )

    # unique=True means the database will reject
    # another account using the same email.
    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )


    # ========================================================
    # PERSONAL INFORMATION
    # ========================================================

    phone_number = db.Column(
        db.String(30),
        nullable=True
    )


    # ========================================================
    # PROFESSIONAL INFORMATION
    # ========================================================

    job_title = db.Column(
        db.String(120),
        nullable=True
    )

    company = db.Column(
        db.String(150),
        nullable=True
    )

    department = db.Column(
        db.String(120),
        nullable=True
    )

    # Employee ID can be different from the database ID.
    # For example: EMP001, EMP002, etc.
    employee_id = db.Column(
        db.String(50),
        unique=True,
        nullable=True
    )


    # ========================================================
    # USER ROLE
    # ========================================================
    # Role is kept in the database for permissions.
    # It is NOT editable from the Settings page.
    #
    # Possible values:
    # administrator
    # legal
    # contract_manager
    # employee

    role = db.Column(
        db.String(50),
        nullable=False,
        default="employee"
    )


    # ========================================================
    # PASSWORD
    # ========================================================
    # IMPORTANT:
    # Never store the user's actual password.
    # This field stores only the hashed password.
    #
    # Password hashing/checking is handled in auth.py.

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )


    # ========================================================
    # ACCOUNT CREATION DATE
    # ========================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    # ========================================================
    # RELATIONSHIP TO CONTRACTS
    # ========================================================
    # Lets us do user.contracts to get all contracts this user
    # uploaded. cascade="all, delete-orphan" means if a user is
    # ever deleted, their contracts are deleted too instead of
    # being left behind with a dangling user_id.

    contracts = db.relationship(
        "Contract",
        backref="user",
        cascade="all, delete-orphan"
    )


    # ========================================================
    # CONVERT USER TO DICTIONARY
    # ========================================================
    # Used when sending user information to the frontend.
    #
    # IMPORTANT:
    # password_hash is intentionally NOT included.

    def to_dict(self):

        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone_number": self.phone_number,
            "job_title": self.job_title,
            "company": self.company,
            "department": self.department,
            "employee_id": self.employee_id,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class Contract(db.Model):

    __tablename__ = "contracts"

    # ========================================================
    # BASIC INFO
    # ========================================================

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    name = db.Column(
        db.String(255),
        nullable=False
    )

    # The filename actually saved on disk in backend/uploads/
    # (kept separate from "name" so we can safely rename files
    # on disk without touching what's shown to the user).
    file_path = db.Column(
        db.String(500),
        nullable=True
    )


    # ========================================================
    # ANALYSIS RESULTS
    # ========================================================
    # IMPORTANT:
    # There is no real AI analysis connected yet. These values
    # are generated with placeholder logic when a contract is
    # uploaded (see app.py), just so the UI has real numbers to
    # show instead of hardcoded demo data. Swap that logic out
    # once a real analysis service is connected.

    status = db.Column(
        db.String(50),
        nullable=False,
        default="Analyzed"
    )

    risk = db.Column(
        db.String(20),
        nullable=False,
        default="Pending"
    )

    score = db.Column(db.Integer, nullable=True)
    completeness = db.Column(db.Integer, nullable=True)

    high_risk = db.Column(db.Integer, nullable=True)
    medium_risk = db.Column(db.Integer, nullable=True)
    low_risk = db.Column(db.Integer, nullable=True)
    total_clauses = db.Column(db.Integer, nullable=True)


    # ========================================================
    # UPLOAD DATE
    # ========================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )


    # ========================================================
    # CONVERT CONTRACT TO DICTIONARY
    # ========================================================
    # Field names here match what my-contracts.js and
    # review-report.js already expect (highRisk, mediumRisk,
    # totalClauses, etc.) so the frontend didn't need to change
    # its field names, just where the data comes from.
    #
    # "reviewedBy" isn't a stored column - since only a
    # contract's owner ever reviews it, we just pull the name
    # live from the linked User instead of storing a copy of it.

    def to_dict(self):

        return {
            "id": self.id,
            "name": self.name,
            "date": self.created_at.strftime("%B %d, %Y"),
            "status": self.status,
            "risk": self.risk,
            "score": self.score,
            "completeness": self.completeness,
            "highRisk": self.high_risk,
            "mediumRisk": self.medium_risk,
            "lowRisk": self.low_risk,
            "totalClauses": self.total_clauses,
            "reviewedBy": self.user.full_name if self.user else None,
            "fileUrl": f"/contracts/{self.id}/file" if self.file_path else None,
        }