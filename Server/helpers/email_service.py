import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("uvicorn.error")

BASE_DIR = Path(__file__).resolve().parent.parent  # points to Server/


# ============================================================================
# SETTINGS — add these 3 lines to your existing .env file:
#   SMTP_HOST=smtp.gmail.com
#   SMTP_USER=your_email@gmail.com
#   SMTP_PASSWORD=your_app_password
# ============================================================================
class EmailSettings(BaseSettings):
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str       # Gmail → use an App Password, not your real password

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache
def get_email_settings() -> EmailSettings:
    return EmailSettings()


# ============================================================================
# CORE SEND FUNCTION
# ============================================================================
def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send a single HTML email via SMTP TLS.
    Returns True on success, False on failure (never raises).
    """
    cfg = get_email_settings()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = cfg.SMTP_USER
    msg["To"]      = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(cfg.SMTP_HOST, cfg.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(cfg.SMTP_USER, cfg.SMTP_PASSWORD)
            server.sendmail(cfg.SMTP_USER, to_email, msg.as_string())

        logger.info(f"📧 Email sent → {to_email} | {subject}")
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed — check SMTP_USER / SMTP_PASSWORD in .env")
    except smtplib.SMTPConnectError:
        logger.error(f"Cannot reach SMTP server {cfg.SMTP_HOST}:{cfg.SMTP_PORT}")
    except Exception as e:
        logger.error(f"Email send failed to {to_email}: {e}")

    return False


# ============================================================================
# SHARED HTML SHELL
# ============================================================================
def _wrap(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body      {{ margin:0; padding:0; background:#f0f2f5;
                 font-family:'Segoe UI', Arial, sans-serif; }}
    .wrapper  {{ max-width:600px; margin:40px auto; background:#ffffff;
                 border-radius:10px; overflow:hidden;
                 box-shadow:0 4px 16px rgba(0,0,0,.10); }}
    .header   {{ background:#1a1a2e; padding:28px 36px;
                 text-align:center; }}
    .header h1{{ margin:0; color:#e94560; font-size:24px;
                 letter-spacing:2px; }}
    .header p {{ margin:6px 0 0; color:#aaa; font-size:13px; }}
    .body     {{ padding:36px; color:#333; line-height:1.75; font-size:15px; }}
    .body h2  {{ margin-top:0; color:#1a1a2e; font-size:20px; }}
    .info-box {{ background:#f5f7ff; border-left:4px solid #e94560;
                 border-radius:4px; padding:16px 20px; margin:24px 0; }}
    .info-box p{{ margin:5px 0; font-size:14px; color:#444; }}
    .info-box strong{{ color:#1a1a2e; }}
    .btn      {{ display:inline-block; margin-top:24px; padding:13px 32px;
                 background:#e94560; color:#ffffff; text-decoration:none;
                 border-radius:6px; font-weight:bold; font-size:15px;
                 letter-spacing:.5px; }}
    .divider  {{ border:none; border-top:1px solid #eee; margin:28px 0; }}
    .footer   {{ background:#f9f9f9; text-align:center; padding:18px;
                 font-size:12px; color:#aaa;
                 border-top:1px solid #eee; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎯 HireVision</h1>
      <p>AI-Powered Hiring Platform</p>
    </div>
    <div class="body">{content}</div>
    <div class="footer">
      © HireVision · This is an automated message — please do not reply directly.
    </div>
  </div>
</body>
</html>"""


# ============================================================================
# TEMPLATE 1 — Interview Invitation
# ============================================================================
def build_interview_invitation(
    candidate_name: str,
    job_title: str,
    company_name: str,
    interview_date: str,          # formatted string, e.g. "2026-04-10 03:00 PM"
    session_id: str,
    recruiter_name: str,
    interview_link: str = "",     # optional deep-link into your frontend
    extra_notes: str = ""
) -> tuple[str, str]:
    """Returns (subject, html_body)."""

    link_block = (
        f'<a class="btn" href="{interview_link}">🚀 Start Interview</a>'
        if interview_link else
        f'<p>Your session ID: <strong>{session_id}</strong></p>'
    )
    notes_block = (
        f"<p><strong>📝 Notes from recruiter:</strong> {extra_notes}</p><hr class='divider'/>"
        if extra_notes else ""
    )

    content = f"""
    <h2>You're Invited to an Interview!</h2>
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>
      Congratulations! We're pleased to invite you to an interview for the
      <strong>{job_title}</strong> position at <strong>{company_name}</strong>.
    </p>

    <div class="info-box">
      <p>📋 <strong>Position:</strong> {job_title}</p>
      <p>🏢 <strong>Company:</strong> {company_name}</p>
      <p>📅 <strong>Scheduled Date:</strong> {interview_date}</p>
      <p>👤 <strong>Recruiter:</strong> {recruiter_name}</p>
      <p>🔑 <strong>Session ID:</strong> {session_id}</p>
    </div>

    {notes_block}
    <p>Click the button below to access your interview session:</p>
    {link_block}

    <hr class="divider"/>
    <p style="font-size:13px; color:#777;">
      Please make sure you are in a quiet, well-lit environment before starting.
      If you have any questions, contact your recruiter directly.
    </p>
    <p>Best of luck,<br/>
       <strong>{recruiter_name}</strong><br/>
       {company_name} · via HireVision
    </p>
    """
    subject = f"Interview Invitation – {job_title} at {company_name}"
    return subject, _wrap(content)


# ============================================================================
# TEMPLATE 2 — Application Status Update
# ============================================================================
def build_status_update(
    candidate_name: str,
    job_title: str,
    company_name: str,
    status: str,           # "shortlisted" | "accepted" | "rejected"
    recruiter_name: str,
    custom_message: str = ""
) -> tuple[str, str]:
    """Returns (subject, html_body)."""

    STATUS_MAP = {
        "shortlisted": ("✅", "#27ae60", "You have been shortlisted",
                        "We were impressed by your profile and have shortlisted you for the next stage."),
        "accepted":    ("🎉", "#2980b9", "You've been accepted!",
                        "We are thrilled to let you know that you have been selected for this role."),
        "rejected":    ("📋", "#e74c3c", "Application Update",
                        "After careful consideration, we will not be moving forward with your application at this time. We encourage you to apply for future openings."),
    }

    icon, color, headline, default_msg = STATUS_MAP.get(
        status.lower(),
        ("📌", "#555", "Application Update", "There is an update regarding your application.")
    )

    message = custom_message or default_msg

    content = f"""
    <h2>{icon} {headline}</h2>
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>{message}</p>

    <div class="info-box">
      <p>📋 <strong>Position:</strong> {job_title}</p>
      <p>🏢 <strong>Company:</strong> {company_name}</p>
      <p>📊 <strong>Status:</strong>
        <span style="color:{color}; font-weight:bold;">{status.capitalize()}</span>
      </p>
    </div>

    <p>
      Thank you for the time and effort you invested in this application.
      We wish you the very best in your career journey.
    </p>
    <p>Kind regards,<br/>
       <strong>{recruiter_name}</strong><br/>
       {company_name} · via HireVision
    </p>
    """
    subject = f"Application Update – {job_title} at {company_name}"
    return subject, _wrap(content)


# ============================================================================
# TEMPLATE 3 — Interview Result / Final Summary
# ============================================================================
def build_interview_result(
    candidate_name: str,
    job_title: str,
    company_name: str,
    technical_score: float,       # 0–100
    recruiter_name: str,
    next_steps: str = ""
) -> tuple[str, str]:
    """Returns (subject, html_body)."""

    # Colour-code the score
    if technical_score >= 75:
        score_color, verdict = "#27ae60", "Excellent"
    elif technical_score >= 50:
        score_color, verdict = "#f39c12", "Good"
    else:
        score_color, verdict = "#e74c3c", "Needs Improvement"

    next_block = (
        f"<p><strong>Next Steps:</strong> {next_steps}</p>"
        if next_steps else ""
    )

    content = f"""
    <h2>📊 Your Interview Results</h2>
    <p>Dear <strong>{candidate_name}</strong>,</p>
    <p>
      Thank you for completing your interview for <strong>{job_title}</strong>
      at <strong>{company_name}</strong>. Here is a summary of your performance.
    </p>

    <div class="info-box">
      <p>📋 <strong>Position:</strong> {job_title}</p>
      <p>🏢 <strong>Company:</strong> {company_name}</p>
      <p>🏆 <strong>Technical Score:</strong>
        <span style="color:{score_color}; font-weight:bold;">
          {technical_score:.1f} / 100 — {verdict}
        </span>
      </p>
    </div>

    {next_block}

    <p>
      Your detailed feedback report has been shared with the recruiting team.
      We appreciate the effort you put into this interview.
    </p>
    <p>Best regards,<br/>
       <strong>{recruiter_name}</strong><br/>
       {company_name} · via HireVision
    </p>
    """
    subject = f"Your Interview Results – {job_title} at {company_name}"
    return subject, _wrap(content)
