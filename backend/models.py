# ============================================================
# models.py
#
# This defines the "users" table using SQLAlchemy.
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