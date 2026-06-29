
<div align="center">
  <img src="/Client/public/HireVision_full_logo.png" alt="HireVision Logo" width="250" />
  
  <h3>Intelligent Recruitment Platform with CV Analysis and Video Interview Evaluation</h3>
  <br>
</div>

**HireVision** is an AI-powered recruitment platform that automates and enhances the hiring process end-to-end — from candidate–job matching, to AI-driven technical interviews, to interview integrity monitoring — by integrating Natural Language Processing, Large Language Models, Computer Vision, Machine Learning, and Speech Processing.

The platform replaces manual, time-consuming recruitment steps (CV screening, interview scheduling, technical assessment, proctoring) with explainable, data-driven automation for both **job seekers** and **recruiters**.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Core Modules](#core-modules)
  - [1. CV Ranking & Job Recommendation](#1-cv-ranking--job-recommendation)
  - [2. Question Generation & Answer Evaluation (QnA)](#2-question-generation--answer-evaluation-qna)
  - [3. Video Interview Analysis](#3-video-interview-analysis)
- [Results & Evaluation](#results--evaluation)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Meet The Team](#meet-the-team)
- [Future Work](#future-work)

---

## Overview

HireVision is built around two parallel user flows — **Job Seeker** and **Recruiter** — that converge into a shared AI interview pipeline made up of three core modules:

1. **CV Ranking & Job Recommendation Module**
2. **Question Generation & Answer Evaluation (QnA) Module**
3. **Video Interview Analysis Module**

On the job seeker side, candidates upload a CV, get matched to relevant job postings based on extracted skills, apply, and undergo an AI-evaluated interview (real or mock practice). On the recruiter side, recruiters post jobs, receive applications, and get AI-ranked candidate lists alongside automated interview feedback to support final hiring decisions.

Results from the QnA and Video Analysis modules are merged per question into a unified technical feedback report, which feeds back into the recruiter's candidate ranking and final selection step — closing the loop between interview performance and hiring decisions.

## System Architecture

After registration and role selection:

- **Job Seeker Path:** CV upload → skill extraction → candidate clustering → job recommendation → job application.
- **Recruiter Path:** job posting → job clustering → receiving applications → candidate ranking.

Both paths share the same clustering and matching logic (Module 1). Once a job is posted or a mock interview is started, the system transitions into an **Interview Session**, running two modules concurrently per question:

- The **QnA Module**, which generates questions, captures and transcribes answers, and evaluates them.
- The **Video Interview Analysis Module**, which processes the submitted video for personality assessment and proctoring (face authentication, eye gaze/head pose, phone detection).

## Core Modules

### 1. CV Ranking & Job Recommendation

This module handles the core matching logic between job seekers and recruiters, and is split into two sub-systems:

**Job Recommendation** — a five-phase pipeline that turns unstructured CVs and job descriptions into structured skill profiles and matches candidates to relevant jobs:

1. **Skill Extraction from CVs** — dual extraction via SkillNER (rule-based) and a transformer-based NER model, consolidated into a unified skill set.
2. **Skill Validation & Filtering** — extracted skills are embedded (`mxbai-embed-large-v1`) and validated against a reference skill database via cosine similarity (≥ 0.80 threshold); generic soft skills are filtered out.
3. **Candidate Clustering (FAISS)** — validated skill vectors are indexed with `FAISS IndexFlatIP` and assigned to professional domain clusters (e.g., Backend, Frontend, ML Engineering, DevOps).
4. **Job Clustering** — job descriptions go through the same extraction/validation/clustering pipeline, placing jobs and candidates in a shared semantic skill space.
5. **Job Recommendation** — candidates are matched to jobs within their assigned cluster, producing a personalized list of relevant openings without needing a separate ranking model at this stage.

**CV Ranking** — a five-phase hybrid multi-signal pipeline that scores and ranks candidates against a specific job posting:

1. **Pre-processing & Embedding** — PII masking, skill-term normalization, and embedding generation (`mxbai-embed-large-v1`, 1024-dim vectors) for both CV and job text.
2. **Dual Retrieval** — a Dense semantic path (FAISS `IndexFlatIP` cosine similarity) and a Sparse lexical path (`BM25Okapi`) run in parallel, each scaled to `[0.0, 1.0]`.
3. **Multi-Signal Hybrid Skill Matching** — each required skill is checked via four independent signals (Exact, Fuzzy via `rapidfuzz`, Semantic, and Context-window matching), then combined into a weighted Skill Score using tiered skill-importance weighting (High/Medium/Low priority).
4. **Fusion Engine** — Dense, Sparse, and Skill scores are bounds-checked and combined into a single Fusion Score.
5. **Cross-Encoder Reranking & Final Output** — a `cross-encoder/ms-marco-MiniLM-L-6-v2` model jointly scores the full CV–job text pair; the normalized Rerank score is combined with the Skill score, Rerank score, and Retrieval score into a Final Score. Candidates are sorted and an AI feedback PDF is generated per candidate and stored in Cloudinary.

### 2. Question Generation & Answer Evaluation (QnA)

Handles the verbal/written component of the interview:

- **Question & Reference Answer Generation** — role-specific interview questions and reference answers generated via prompt engineering on **OpenAI GPT-OSS-120B** (through the Groq API), with JSON-constrained decoding and schema validation.
- **Speech-to-Text Transcription** — candidate audio is extracted (FFmpeg) and transcribed using **Whisper Large V3 Turbo** via Groq.
- **Candidate Answer Evaluation** — answers are scored against reference answers using role/rubric-based prompting, producing structured, machine-readable evaluation reports.

### 3. Video Interview Analysis

Processes each interview's video submission for behavioral and integrity signals:

- **Personality Traits Assessment** — an R3D-18 (3D ResNet, Kinetics-400 pretrained) model predicts Big Five personality traits from sampled, face-cropped video frames (faces detected via MTCNN).
- **Head Pose & Eye Gaze Analysis** — real-time facial landmark/iris tracking (MediaPipe) with temporal validation to flag suspicious gaze/attention behavior.
- **Phone Usage Detection** — a YOLOv8n classification model flags phone usage during the interview.
- **Face Authentication** — verifies candidate identity throughout the session.

Outputs from all three checks are consolidated into an Interview Feedback Report for recruiters.

## Results & Evaluation

| Component | Metric | Result |
|---|---|---|
| Candidate Clustering | Normalized Mutual Information (NMI) | 0.87 |
| CV Ranking | NDCG vs. Annotator | 0.85 |
| Reference Answer Generation | Mean Semantic Similarity vs. expert answers | 0.82 (82%) |
| Interview Q&A Framework | Overall System Score | 8.50 / 10 |
| Personality Prediction | 1 − Error score | 0.889 |


## Tech Stack

**Frontend**
- React.js
- Tailwind CSS
- react-router-dom · Axios · react-hot-toast · lucide-react

**Backend**
- FastAPI (REST API layer)
- MongoDB (resumes, sessions, evaluation results, logs)

**CV Ranking & Job Recommendation**
- PyMuPDF · SkillNER · Sentence Transformers (`mxbai-embed-large-v1`)
- FAISS · BM25Okapi · rapidfuzz · Cross-Encoder (`ms-marco-MiniLM-L-6-v2`)
- LLMs (candidate summaries & recommendation explanations)

**Interview Q&A Generation & Evaluation**
- Groq API · OpenAI GPT-OSS-120B
- Whisper Large V3 Turbo (Speech-to-Text) · FFmpeg
- Prompt engineering, JSON-constrained decoding & schema validation

**Personality Prediction**
- PyTorch · TorchVision (R3D-18, Kinetics-400 pretrained)
- facenet-pytorch (MTCNN) · MoviePy · SciPy

**Head Pose, Eye Gaze & Phone Detection**
- MediaPipe Face Landmarker · MediaDevices API
- YOLOv8n · OpenCV · Transfer Learning

## Repository Structure

```
HireVision/
├── Client/                     # React.js Frontend Application
│   ├── public/
│   └── src/
│       ├── api/                # API integration
│       ├── assets/             # Images, styles, and static files
│       ├── components/         # Reusable UI components (JobSeeker, Recruiter, etc.)
│       ├── context/            # Global state management
│       ├── hooks/              # Custom React hooks
│       └── pages/              # Main application views
│
├── Server/                     # Main Backend Application & API Gateway
│   ├── config/                 # Environment and DB configurations
│   ├── controllers/            # Request handlers
│   ├── helpers/                # Pipeline and shared utilities
│   ├── models/                 # Database schemas & enums
│   └── routes/                 # API endpoint definitions
│
├── Module_1/                   # CV Ranking & Job Recommendation Engine
│   ├── Datasets/               # Training and testing data (Clustering, CVs)
│   ├── faiss_store/            # FAISS vector database storage
│   └── src/
│       ├── ranking_system/     # Core ranking logic (Dense, Sparse, Cross-Encoder)
│       └── models/             # Module-specific AI models
│
├── Module_2/                   # Video Interview Analysis & Proctoring
│   ├── cheating_detection/     # Integrity checks
│   │   ├── headPose_eyeGaze/   # MediaPipe trackers
│   │   └── object_detection/   # YOLOv8 phone detection
│   ├── Personality_Traits/     # R3D-18 model for behavioral analysis
│   └── userAuthn/              # Identity verification and embeddings
│
├── Module_3/                   # Automated Q&A & Evaluation
│   ├── Answer_Evaluation/      # LLM-as-a-judge scoring logic
│   ├── Question_Generation/    # Dynamic prompt engineering logic
│   └── STT/                    # Whisper Speech-to-Text services
│
└── README.md
```

The project follows a modular architecture, separating the core AI models into distinct microservices interacting with the main backend and frontend applications

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd HireVision

# Backend setup
pip install -r requirements.txt
python -m uvicorn Server.main:app

# Frontend setup
cd Client
npm install
npm run dev
```
---

## Meet The Team

Developed as a graduation project at **Ain Shams University** (Faculty of Computer and Information Sciences) by:

- [Eman Ashraf Ebrahim](https://github.com/E-emanAshraf)
- [Tasneem Alaa Ahmed](https://github.com/Tasneem-Alaa)
- [Habiba Yousri Saied](https://github.com/HabibaYossre)
- [Safwa Ibrahim Salah](https://github.com/safwa25)
- [Shrouk Mohamed Aboalela](https://github.com/ShroukAboalela)
- [Raheeq Ayman Ramadan](https://github.com/Ra7eeq1912005)

**Supervised by:**
- Dr. Ahmed Salah
- TA. Hossam Sherif

---

## Future Work

- **Problem-Solving Assessments** — coding/technical challenges alongside theoretical Q&A.
- **Real-Time Interview Analysis** — live, in-session feedback during interviews.
- **Multilingual Support** — extending question generation, evaluation, and transcription beyond English.

---
