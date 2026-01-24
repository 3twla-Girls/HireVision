import os
import re
import time
from pathlib import Path
from CONFIG import CONFIG
# Parsing
import docx
from PyPDF2 import PdfReader
import pdfplumber
#pip install pdfplumber PyPDF2 python-docx

# -----------------------------
# Timing utility
# -----------------------------
def time_function(func):
    """Decorator to measure function execution time"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"  ⏱️  {func.__name__}: {end_time - start_time:.3f} seconds")
        return result
    return wrapper

# -----------------------------
# 1) Parsing helpers
# -----------------------------
@time_function
def extract_text_from_pdf(path: str) -> str:
    try:
        text_parts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except:
        try:
            reader = PdfReader(path)
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except:
            return ""

@time_function
def parse_docx(path: str) -> str:
    try:
        doc = docx.Document(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text)
    except:
        return ""

@time_function
def parse_text(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return ""

def parse_cv(cv_path: str) -> str:
    print(f"📄 Parsing CV: {cv_path}")
    if not os.path.exists(cv_path):
        print(f"❌ Error: File not found at {cv_path}")
        return ""
    
    ext = Path(cv_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(cv_path)
    if ext == ".docx":
        return parse_docx(cv_path)
    if ext == ".txt":
        return parse_text(cv_path)
    return ""

# -----------------------------
# 2) PII & Skill Normalization
# -----------------------------
EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_RE = re.compile(r"(\+\d{1,3}[ -]?)?(\(?\d{2,4}\)?[ -]?){1,}\d{2,4}")

SKILL_NORMALIZATION = {
    r"\bc\s*#\b": "C#",
    r"\bc\+\+\b": "C++",
    r"\bpython3?\b": "Python",
    r"\bjs\b": "JavaScript",
    r"\bjavascript\b": "JavaScript",
    r"\breact(\.js)?\b": "React",
    # r"\bnode\.?js\b": "Node.js",
    r"\basp\.?net\b": "ASP.NET",
    r"\.net\s+(development|framework|core|5|6|7|8)": ".NET",
    r"\bapi\b": "API",
    r"\brest(ful)?\s+api\b": "REST API",
    r"\bsql\s+server\b": "SQL Server",
    r"\bentity\s+framework\b": "Entity Framework",
    r"\bef\s+core\b": "Entity Framework Core",
    r"\bspringboot\b": "Spring Boot",
}

@time_function
def mask_pii(text: str) -> str:
    text = EMAIL_RE.sub("[EMAIL]", text)
    text = PHONE_RE.sub("[PHONE]", text)
    return text

@time_function
def normalize_skills(text: str) -> str:
    for pat, rep in SKILL_NORMALIZATION.items():
        text = re.sub(pat, rep, text, flags=re.IGNORECASE)
    return text

# ============================================================================
# CV METADATA EXTRACTION
# ============================================================================
class CVAnalyzer:
    #ُْEXPERIENCE YEARS
    @staticmethod
    def extract_years_experience(cv_text: str) -> float:
        patterns = [
            r"(\d+)\+?\s*years?\s+(?:of\s+)?experience",
            r"experience[:\s]+(\d+)\+?\s*years?",
            r"(\d+)\+?\s*yrs?\s+experience"
        ]
        years = []
        for pat in patterns:
            matches = re.findall(pat, cv_text.lower())
            years.extend([int(m) for m in matches])

        if years:
            return max(years)

        dates = re.findall(r"\b(19|20)\d{2}\b", cv_text)
        if len(dates) >= 2:
            return max(int(d) for d in dates) - min(int(d) for d in dates)
        return 0.0

    #EDUCATION
    @staticmethod
    def extract_education(cv_text: str) -> str:
        cv_low = cv_text.lower()
        if any(w in cv_low for w in ["phd", "ph.d", "doctorate"]):
            return "phd"
        if any(w in cv_low for w in ["master", "m.sc", "msc", "masters"]):
            return "masters"
        if any(w in cv_low for w in ["bachelor", "b.sc", "bsc", "undergraduate"]):
            return "bachelors"
        if any(w in cv_low for w in ["diploma", "associate"]):
            return "diploma"
        return "unknown"

    #SENIORITY
    @staticmethod
    def get_seniority_level(years: float) -> str:
        if years < 2:
            return "junior"
        elif years < 5:
            return "mid"
        return "senior"
    
