import re
from io import BytesIO
from groq import Groq

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from Server.helpers.config import get_settings


class FeedbackController:

    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    # ----------------------------------
    # Generate AI Feedback
    # ----------------------------------
    def generate_cv_feedback(self, job_role, job_description, cv_text):

        prompt = f"""
You are a senior HR recruiter specialized in the role of {job_role}.

Job Role:
{job_role}

Job Description:
{job_description}

Candidate CV:
{cv_text}

Analyze the CV against the job description and generate structured professional feedback.

STRICT RULES:
- Use only plain English characters ASCII only
- No special symbols
- No stars
- Use bullet format using this symbol only: -
- Maximum 5 bullet points per section
- Each bullet must be concise and professional

Structure exactly like this:

Overall Evaluation:
-
-
-
-
-

Strengths:
-
-
-
-
-

Skill Gaps:
-
-
-
-
-

Improvement Plan:
-
-
-
-
-
"""

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": f"You are a professional HR recruiter specialized in {job_role}."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        return response.choices[0].message.content

    # ----------------------------------
    # Clean Feedback Text
    # ----------------------------------
    def clean_feedback_text(self, text):

        text = text.encode("ascii", "ignore").decode()

        text = re.sub(r'[•■▪●◆▶]', '', text)

        text = re.sub(r'\n{3,}', '\n\n', text)

        return text.strip()

    # ----------------------------------
    # Create PDF in Memory
    # ----------------------------------
    def create_feedback_pdf(self, feedback_text, job_role):

        buffer = BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()

        header_style = ParagraphStyle(
            name="HeaderStyle",
            parent=styles["Normal"],
            fontSize=12,
            leading=14,
            textColor=colors.lightseagreen,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            name="BodyStyle",
            parent=styles["Normal"],
            fontSize=9,
            leading=14,
            spaceAfter=6
        )

        elements = []

        elements.append(
            Paragraph(f"<b>Candidate Feedback - {job_role}</b>", styles["Title"])
        )

        elements.append(Spacer(1, 20))

        for line in feedback_text.split("\n"):

            line = line.strip()

            if not line:
                continue

            if line.endswith(":"):

                elements.append(
                    Paragraph(f"<b>{line}</b>", header_style)
                )

                elements.append(Spacer(1, 8))

            elif line.startswith("-"):

                bullet_text = line[1:].strip()

                elements.append(
                    Paragraph(f"- {bullet_text}", body_style)
                )

                elements.append(Spacer(1, 4))

            else:

                elements.append(
                    Paragraph(line, body_style)
                )

                elements.append(Spacer(1, 6))

        doc.build(elements)

        pdf_bytes = buffer.getvalue()

        buffer.close()

        return pdf_bytes

    # ----------------------------------
    # Full Pipeline
    # ----------------------------------
    def generate_feedback_pdf(self, job_role, job_description, cv_text):

        raw_feedback = self.generate_cv_feedback(
            job_role,
            job_description,
            cv_text
        )

        clean_feedback = self.clean_feedback_text(raw_feedback)

        pdf_bytes = self.create_feedback_pdf(
            clean_feedback,
            job_role
        )

        return pdf_bytes