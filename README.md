# HireVision - AI-Powered Intelligent Recruitment Platform

## Overview

HireVision is an end-to-end AI-powered recruitment platform designed to streamline the hiring process through intelligent CV analysis, automated technical interviews, personality assessment, and multi-modal cheating detection.

The platform combines Natural Language Processing (NLP), Large Language Models (LLMs), Computer Vision, and Deep Learning to provide recruiters with a smarter and more efficient candidate evaluation system.

---

# Features

## AI CV Analysis & Ranking
- Semantic CV matching using SentenceTransformers
- Skill extraction using SkillNER
- Intelligent candidate ranking and recommendation
- Automated job-candidate similarity scoring

## AI Interview System
- Adaptive technical interview generation using Groq LLM
- Dynamic question generation based on candidate skills
- Real-time answer evaluation and feedback
- Automated interview workflow

## Multi-Modal Cheating Detection
- Eye-gaze tracking using Mediapipe
- Head-pose estimation
- Prohibited object detection (phones/laptops) using YOLOv8
- Real-time interview monitoring

## Personality Traits Assessment
- Candidate behavior analysis using R3D-18
- Big Five personality trait prediction
- Video-based personality evaluation

## Speech Processing
- Audio transcription using Groq Whisper
- Speech preprocessing with FFmpeg
- Real-time voice analysis pipeline

---

# Tech Stack

## AI & Machine Learning
- PyTorch
- TensorFlow
- Scikit-learn
- SentenceTransformers
- SkillNER
- YOLOv8
- Mediapipe
- Groq LLM
- Groq Whisper

## Backend
- FastAPI
- Flask
- Python

## Data Processing
- Pandas
- NumPy
- FFmpeg

## Tools
- Git & GitHub
- Jupyter Notebook

---

# System Architecture

```bash
Candidate CV → Skill Extraction → Semantic Matching → Ranking System
                                     ↓
                            AI Interview Generation
                                     ↓
                      Video Interview & Speech Analysis
                                     ↓
         Cheating Detection + Personality Assessment
                                     ↓
                        Final Candidate Evaluation
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-username/HireVision.git
cd HireVision
```

## Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Run the Project

## Backend

```bash
uvicorn app:app --reload
```

## Frontend

```bash
npm install
npm run dev
```

---

# Performance Highlights

- 87% NMI score in semantic CV ranking
- 93% accuracy in personality assessment
- Real-time cheating detection pipeline
- High-speed LLM inference using Groq APIs

---

# Future Improvements

- RAG-powered recruitment assistant
- Fine-tuned recruitment LLM
- AI-generated interview reports
- Real-time emotion recognition
- Multi-language interview support
- Cloud deployment & MLOps pipeline

---

# Contributors

- Raheeq Ayman Ramadan Mohamed
- Eman Ashraf Ibrahim
- Shrouk Mohamed AboAlOla
- Tasneem Alaa Ahmed
- Habiba Yousri Said 
- Safwa Ibrahim Salah Ibrahim

---

# License

This project is licensed under the MIT License.
