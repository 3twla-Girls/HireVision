
# ✅ **Goal of Submodule 2 — Answer Evaluation**

This module should:

1. Evaluate each candidate answer.
2. Give recruiter-friendly scoring.
3. Give candidate-friendly feedback.
4. Highlight strengths & weaknesses.
5. Provide an **overall performance summary** across all questions.

To do this properly, we use **two prompts** (best practice):

* **Prompt A: Per-question evaluation**
* **Prompt B: Final overall performance summary**

---

# ✅ **Why Two Prompts?**

### **One prompt per question = accurate**

* Gives deep evaluation per answer.
* Allows you to store structured scores (0–10).
* Perfect for recruiter dashboards.

### **One second prompt for final summary = clean and comprehensive**

* Uses all per-question evaluations.
* Highlights overall strengths, weaknesses, soft skills, etc.

This is the same design used in platforms like **Interviewer.AI**, **HackerRank**, and **Google Interview Warmup**.

---

# ❤️ Recommended Implementation

(I’ll give you ready-to-use prompts)

---

# **🧩 Prompt A — Per-Question Answer Evaluation**

Use this for EACH question + candidate answer.

### **Input You Provide**

* **Question**
* **Candidate Answer**
* **Skill/topic** (optional but recommended)
* **Expected answer** (auto-generated or simple summary)

---

### ✅ **Final Prompt A (copy-paste ready)**

**ROLE: Expert Technical Interview Evaluator**

Evaluate the candidate's answer based on the following details:

**Question:** {question}
**Expected Concepts:** {expected_concepts or reference_answer}
**Candidate Answer:** {candidate_answer}

### **Evaluation Requirements**

Provide output in this JSON format:

```
{
  "score": "0–10",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "missing_points": ["..."],
  "overall_feedback": "1 short paragraph"
}
```

### **Scoring Rubric**

* **9–10**: Complete, correct, technically solid, excellent clarity.
* **7–8**: Mostly correct, minor missing points.
* **5–6**: Some correct ideas but incomplete.
* **3–4**: Major gaps or limited understanding.
* **0–2**: Wrong, irrelevant, or no answer.

---

This gives you:

* Standard scoring
* Recruiter-friendly structure
* Easy storage in database
* Easy later summarization

---

# **🧩 Prompt B — Final Overall Performance Summary**

After evaluating all questions (using Prompt A), collect all per-question outputs and feed them into the summary prompt.

### **Input You Provide**

* A list of evaluations from prompt A (scores, strengths, weaknesses).

---

### ✅ **Final Prompt B (copy-paste ready)**

**ROLE: Interview Performance Analyst**

You are given structured evaluation data for the candidate’s answers to multiple technical interview questions.

**Evaluation Data:**
{evaluations_json_list}

### **Your Task**

Create an overall summary that includes:

1. **Final Score (0–10)**

   * Weighted average from all questions.

2. **Overall Strengths**

   * Combine recurring strengths across questions.

3. **Overall Weaknesses**

   * Combine recurring weak areas.

4. **Skill-wise Assessment**

   * Mention how well the candidate performed in each skill or topic.

5. **Final Reviewer Summary (for recruiter)**

   * 3–4 sentences.

6. **Candidate Improvement Tips**

   * Actionable steps.

Output format should be:

```
{
  "final_score": "",
  "overall_strengths": [],
  "overall_weaknesses": [],
  "skill_assessment": {},
  "summary_for_recruiter": "",
  "tips_for_candidate": ""
}
```

---

# 🔄 **Full Workflow of Submodule 2**

### **Step 1 — For each question**

Call **Prompt A** → store evaluation JSON
Example:

```
eval_results.append(model_output)
```

### **Step 2 — After all questions evaluated**

Pass eval_results to **Prompt B** → get final report

### **Step 3 — Show feedback**

* Recruiter sees: final_score + summary_for_recruiter
* Candidate sees: strengths + weaknesses + improvement tips

---


