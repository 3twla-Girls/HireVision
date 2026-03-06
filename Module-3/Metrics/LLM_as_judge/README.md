# LLM-as-a-Judge Evaluation Metrics

This module provides the auditing and evaluation metric capabilities for the overall pipeline. It uses an LLM acting as a "Judge" (by default `llama-3.3-70b-versatile` via Groq) to score the responses from the Question Generation, Answer Generation, and Answer Evaluation services.

## Overview

The judge system operates across several stages to calculate the overall system quality:
1. **Question Quality**: Evaluates generated questions.
2. **Answer Quality**: Evaluates generated reference answers.
3. **Evaluation Fairness**: Evaluates how fairly the Answer Evaluation service judged candidate answers.
4. **Overall System Quality**: Provides a macro-level score of the entire output.

---

## 1. Metrics & Criteria

### Question Generation
Evaluated on a scale from 0 to 10:
*   **Relevance:** Are the questions relevant to the requested job and skills?
*   **Clarity:** Are the questions clear and unambiguous?
*   **Difficulty Calibration:** Is the difficulty appropriate for the requested experience level?

### Reference Answer Generation
Evaluated on a scale from 0 to 10:
*   **Correctness:** Are the reference answers factually correct?
*   **Completeness:** Do the answers cover all key points expected?
*   **Question Alignment:** Do the answers directly address the questions asked?

### Evaluation Fairness
Evaluates the grader's feedback on a candidate's answer:
*   **Judge Score (0-10):** Overall quality and fairness of the evaluation judgements.
*   **Faithfulness (0-10):** Does the evaluator stay faithful to the candidate's actual answer content without hallucinating?
*   **Bias Detected (Boolean):** Flag for any detected bias in the evaluation.

### Overall System Quality
*   **Consistency (0-10):** Measures the reproducible nature and logical consistency of the entire pipeline logic.
*   **Fluency (0-10):** Evaluates if the generated text is well-written and grammatically correct.
*   **Helpfulness (0-10):** Evaluates the practical usefulness of the output for conducting a real interview.

---

## 2. API Endpoints

All endpoints accept the following `AuditRequest` JSON body:
```json
{
  "job_title": "Software Engineer",
  "skills": ["Python", "System Design"],
  "experience_level": "Senior",
  "num_questions": 5
}
```

### `POST /questions`
Calls the Question-Generation service and judges the generated questions based on Relevance, Clarity, and Difficulty Calibration. Returns average scores and reasoning per question.

### `POST /answers`
Calls the Question-Generation service (which includes reference answers) and judges each answer for Correctness, Completeness, and Question Alignment.

### `POST /evaluation`
Runs a full cycle leveraging simulated candidate answers to evaluate the Answer-Evaluator. Judges the resulting evaluation for Faithfulness, Judge Score, and counts the biases detected.

### `POST /full`
A single connected pipeline audit:
1. Generates questions and answers.
2. Simulates candidate answers to generate evaluations.
3. Judges questions, answers, and evaluations.
4. Judges overall system quality across consistency, fluency, and helpfulness.
5. Returns a `FullAuditResponse` containing all sub-scores, overall reasoning, and aggregated metrics.

---

## 3. System Overall Accuracy Calculation

While the API provides a baseline `system_overall_score` (calculated as an unweighted average of the category averages and overall metrics), the formal comprehensive **System Accuracy** used during notebook analysis (`llm_judge_accuracy.ipynb`) overrides this to apply specific weights to high-priority metrics:

```math
Accuracy\ Score = 
(0.25 \times question\_score) + 
(0.30 \times answer\_score) + 
(0.20 \times avg\_correctness) + 
(0.15 \times avg\_alignment) + 
(0.10 \times avg\_clarity)
```

*(This ensures the final benchmark heavily favors the most critical traits: correct and well-aligned answers, alongside clear and high-quality questions.)*

---

## 4. Setup and Configuration

Dependencies and configurations strictly rely on the project's root `.env` file for the API credentials.

**Environment Variables:**
*   `GROQ_API_KEY`: Groq API key used to instantiate the LLM.
*   `JUDGE_MODEL`: LLM Model used for judging. Defaults to `llama-3.3-70b-versatile`.
