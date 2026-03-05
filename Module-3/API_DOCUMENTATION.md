# HireVision Module-3 — API Documentation

---

## Table of Contents

1. [Question & Answer Generation Module](#1-question--answer-generation-module)
2. [STT (Speech-to-Text) Module](#2-stt-speech-to-text-module)
3. [Answer Evaluation Module](#3-answer-evaluation-module)

---

## 1. Question & Answer Generation Module

**Service:** `Question-Generation/`
**Description:** Generates technical interview questions and reference answers based on job information using an LLM (Groq API).

### 1.1 `POST /generate-questions`

Generate interview questions only (no answers).

#### Request Body

```json
{
  "job_title": "Software Engineer",
  "skills": ["Python", "Django", "REST APIs"],
  "experience_level": "Mid",
  "num_questions": 5
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `job_title` | `string` | ✅ | Target job title |
| `skills` | `list[string]` | ✅ | List of technical skills to test |
| `experience_level` | `string` | ✅ | Candidate level — `"Junior"`, `"Mid"`, or `"Senior"` |
| `num_questions` | `integer` | ✅ | Number of questions to generate |

#### Response `200 OK`

```json
{
  "questions": [
    {
      "id": 1,
      "type": "conceptual",
      "question": "Explain the difference between a list and a tuple in Python."
    },
    {
      "id": 2,
      "type": "mcq",
      "question": "Which HTTP method is idempotent?",
      "options": ["POST", "PUT", "PATCH", "DELETE"]
    },
    {
      "id": 3,
      "type": "short",
      "question": "What is the purpose of Django middleware?"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `questions` | `array` | List of generated questions |
| `questions[].id` | `integer` | Sequential question identifier |
| `questions[].type` | `string` | One of `"conceptual"`, `"mcq"`, `"short"` |
| `questions[].question` | `string` | The question text |
| `questions[].options` | `array` | *(MCQ only)* Multiple-choice options |

#### Response Headers

| Header | Description |
|---|---|
| `X-Total-Tokens` | Total LLM tokens consumed |
| `X-Prompt-Tokens` | Prompt tokens used |
| `X-Completion-Tokens` | Completion tokens generated |
| `X-Process-Time` | Server-side processing time |

---

### 1.2 `POST /generate-questions-with-answers`

Generate interview questions **and** reference answers in a single call.

#### Request Body

Same as [`POST /generate-questions`](#request-body).

#### Response `200 OK`

```json
{
  "questions_with_answers": [
    {
      "id": 1,
      "type": "conceptual",
      "question": "Explain the difference between a list and a tuple in Python.",
      "question_type": "conceptual",
      "reference_answer": "Lists are mutable sequences while tuples are immutable. Lists use square brackets [], tuples use parentheses (). Tuples are generally faster and can be used as dictionary keys."
    },
    {
      "id": 2,
      "type": "mcq",
      "question": "Which HTTP method is idempotent?",
      "options": ["POST", "PUT", "PATCH", "DELETE"],
      "question_type": "mcq",
      "reference_answer": "B"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `questions_with_answers` | `array` | Questions with their reference answers |
| `[].id` | `integer` | Sequential question identifier |
| `[].type` | `string` | Original question type |
| `[].question` | `string` | The question text |
| `[].options` | `array` | *(MCQ only)* Multiple-choice options |
| `[].question_type` | `string` | Confirmed type from the answer generator |
| `[].reference_answer` | `string` | Model-generated reference answer |

#### Response Headers

Same as [`POST /generate-questions`](#response-headers) (tokens are combined from both question and answer generation calls).

---

### 1.3 `POST /generate-answers`

Generate reference answers for a list of pre-existing questions.

#### Request Body

```json
{
  "job_title": "Software Engineer",
  "skills": ["Python", "Django", "REST APIs"],
  "experience_level": "Mid",
  "questions": [
    {
      "id": 1,
      "type": "conceptual",
      "question": "Explain the difference between a list and a tuple in Python."
    },
    {
      "id": 2,
      "type": "mcq",
      "question": "Which HTTP method is idempotent?",
      "options": ["POST", "PUT", "PATCH", "DELETE"]
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `job_title` | `string` | ✅ | Target job title |
| `skills` | `list[string]` | ✅ | List of technical skills for context |
| `experience_level` | `string` | ✅ | Candidate level — `"Junior"`, `"Mid"`, or `"Senior"` |
| `questions` | `list[object]` | ✅ | Array of question objects (as returned by `/generate-questions`) |

#### Response `200 OK`

```json
{
  "answers": [
    {
      "question_id": 1,
      "question_type": "conceptual",
      "reference_answer": "Lists are mutable sequences while tuples are immutable. Lists use square brackets [], tuples use parentheses (). Tuples are generally faster and can be used as dictionary keys."
    },
    {
      "question_id": 2,
      "question_type": "mcq",
      "reference_answer": "B"
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `answers` | `array` | List of generated reference answers |
| `answers[].question_id` | `integer` | Matches the `id` from the input question |
| `answers[].question_type` | `string` | One of `"conceptual"`, `"mcq"`, `"short"` |
| `answers[].reference_answer` | `string` | Model-generated reference answer (MCQ returns the correct option letter) |

#### Response Headers

| Header | Description |
|---|---|
| `X-Total-Tokens` | Total LLM tokens consumed |
| `X-Prompt-Tokens` | Prompt tokens used |
| `X-Completion-Tokens` | Completion tokens generated |

---

## 2. STT (Speech-to-Text) Module

**Service:** `STT/`
**Description:** Accepts an MP4 video file, extracts its audio track using FFmpeg, and transcribes it to text via Groq Whisper (`whisper-large-v3-turbo`).

### 2.1 `POST /stt/transcribe-video`

Upload a video file and receive its transcription.

#### Request

- **Content-Type:** `multipart/form-data`
- **Form Field:** `file` — the MP4 video file to transcribe.

**Example (cURL):**

```bash
curl -X POST <BASE_URL>/stt/transcribe-video \
  -F "file=@interview_clip.mp4"
```

#### Response `200 OK`

```json
{
  "status": "success",
  "transcription": "I would say that the main difference between a list and a tuple is that lists are mutable while tuples are not..."
}
```

| Field | Type | Description |
|---|---|---|
| `status` | `string` | Always `"success"` on a successful transcription |
| `transcription` | `string` | Full transcription text from the video's audio |

#### Internal Pipeline

```
MP4 Video → FFmpeg (extract 16 kHz mono WAV) → Groq Whisper → Text
```

| Step | Tool | Details |
|---|---|---|
| Audio extraction | FFmpeg | 16-bit PCM, 16 kHz sample rate, mono channel |
| Transcription | Groq Whisper `whisper-large-v3-turbo` | Temperature `0.0`, verbose JSON format |

---

## 3. Answer Evaluation Module

**Service:** `Answer-Evaluation/`
**Prefix:** `/api`
**Description:** Evaluates candidate answers against reference answers using an LLM, and generates a final interview summary.

### 3.1 `POST /api/answer-evaluation`

Evaluate a single candidate answer against the correct/reference answer.

#### Request Body

```json
{
  "question": "Explain the difference between a list and a tuple in Python.",
  "correct_answer": "Lists are mutable, tuples are immutable. Lists use [], tuples use ().",
  "candidate_answer": "Lists can be changed after creation, tuples cannot. I think tuples are faster."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `question` | `string` | ✅ | The interview question |
| `correct_answer` | `string` | ✅ | The reference/correct answer |
| `candidate_answer` | `string` | ✅ | The candidate's submitted answer |

#### Response `200 OK`

The response is an LLM-generated JSON evaluation. The exact structure depends on the evaluation prompt, but typically includes:

```json
{
  "score": 7,
  "feedback": "The candidate correctly identified mutability as the key difference...",
  "strengths": ["Understood core concept"],
  "weaknesses": ["Did not mention syntax differences"]
}
```

---

### 3.2 `POST /api/final-summary`

Generate a final interview summary from multiple individual evaluations.

#### Request Body

```json
{
  "evaluations_list": [
    {
      "question": "Explain list vs tuple",
      "score": 7,
      "feedback": "Good understanding of mutability..."
    },
    {
      "question": "What is Django middleware?",
      "score": 5,
      "feedback": "Partial understanding..."
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `evaluations_list` | `list` | ✅ | Array of individual evaluation results from `/api/answer-evaluation` |

#### Response `200 OK`

The response is an LLM-generated JSON summary of the entire interview session. Example:

```json
{
  "overall_score": 6.5,
  "summary": "The candidate demonstrated solid fundamentals in Python but lacked depth in web framework concepts...",
  "strengths": ["Strong Python basics", "Clear communication"],
  "areas_for_improvement": ["Django middleware", "REST API design"]
}
```



---

## Error Responses

All services may return error responses in the following scenarios:

| Status Code | Description |
|---|---|
| `422 Unprocessable Entity` | Request body validation failed (missing or invalid fields) |
| `500 Internal Server Error` | LLM API call or JSON parsing error |

Error responses from LLM calls may include:

```json
{
  "error": "JSON parsing failed: Expecting ',' delimiter",
  "raw_output": "<raw LLM output>"
}
```

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `GROQ_API_KEY` | All services | Groq API key for LLM and Whisper access |
| `ACTIVE_MODEL_KEY` | Question Generation | Active model key — one of `llama_large`, `llama_small`, `gpt_oss20`, `gpt_oss120` (default: `gpt_oss120`) |

### Available Models (Question & Answer Generation)

| Key | Model ID |
|---|---|
| `llama_large` | `llama-3.3-70b-versatile` |
| `llama_small` | `llama-3.1-8b-instant` |
| `gpt_oss20` | `openai/gpt-oss-20b` |
| `gpt_oss120` | `openai/gpt-oss-120b` |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│              Question & Answer Generation                    │
│      /generate-questions                                     │
│      /generate-questions-with-answers                        │
│      /generate-answers                                       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Answer Evaluation                         │
│      /api/answer-evaluation                                  │
│      /api/final-summary                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                          STT                                 │
│      /stt/transcribe-video                                   │
│      MP4 → FFmpeg → Groq Whisper → Text                     │
└──────────────────────────────────────────────────────────────┘
```
