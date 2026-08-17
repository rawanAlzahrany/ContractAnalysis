# ============================================================
# mail_utils.py
#
# Handles generating a one-time code (OTP) and sending it to
# the user's email through Gmail's SMTP server.
#
# SETUP REQUIRED:
# 1. Turn on 2-Step Verification on the Gmail account you want
#    to send from.
# 2. Create an "App Password" (Google Account > Security >
#    App Passwords) - a 16-character password, NOT your normal
#    Gmail password.
# 3. Fill in GMAIL_ADDRESS and GMAIL_APP_PASSWORD below.
# ============================================================

import random
import smtplib
from email.mime.text import MIMEText

# ------------------------------------------------------------
# EDIT THESE TWO LINES
# ------------------------------------------------------------
GMAIL_ADDRESS = "rwanaalzahrany@gmail.com"
GMAIL_APP_PASSWORD = "rpwfykrvexauxopw"  # no spaces


def generate_otp():
    """Returns a random 6-digit code as a string, e.g. '042917'."""
    return str(random.randint(100000, 999999))


def send_otp_email(to_email, otp_code):
    """
    Sends the OTP code to to_email using Gmail's SMTP server.
    Returns True if it sent successfully, False otherwise.
    """

    subject = "Your SANAD verification code"
    body = (
        f"Your SANAD verification code is: {otp_code}\n\n"
        f"This code expires in 10 minutes.\n"
        f"If you didn't request this, you can ignore this email."
    )

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = GMAIL_ADDRESS
    message["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, message.as_string())
        return True

    except Exception as e:
        print("Failed to send OTP email:", e)
        return False
