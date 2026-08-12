# ============================================================
# auth.py
# Small helper functions for turning a plain-text password into
# a safe hash (for signup), and checking a password against that
# hash later (for login). Never store or compare raw passwords.
# ============================================================

from werkzeug.security import generate_password_hash, check_password_hash


def hash_password(plain_password):
    # turns "mypassword123" into something like "pbkdf2:sha256:..."
    # that can't be reversed back into the original password
    return generate_password_hash(plain_password)


def verify_password(plain_password, password_hash):
    # compares what the user just typed against the stored hash
    # returns True/False, never reveals the real password
    return check_password_hash(password_hash, plain_password)
