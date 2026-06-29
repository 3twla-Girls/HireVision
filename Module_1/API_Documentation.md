# 🚀API DOCUMENTATION (HireVision API Module 1)

---

### 🌍 Base URL

**Local Development**

```
http://127.0.0.1:8000
```

**API Base Path**

```
http://127.0.0.1:8000/api/v1/
```

**Using Environment Variable**

```
{{api}} = http://127.0.0.1:8000
{{api}}/api/v1/
```


**API Purpose**
HireVision API provides:

- CV skill extraction
- Candidate clustering
- Job management
- File uploads
- Clustering evaluation

---

# 🧠 SKILLS & CLUSTERING API

`/api/v1/skills`

---

## 🔹 1. Process CV

**POST** `/skills/process_cv/{project_id}/{file_id}`

### Description

Extracts skills from a CV, generates embeddings, and assigns the candidate to a similarity cluster.

### Path Parameters

| Name       | Type   | Required | Description         |
| ---------- | ------ | -------- | ------------------- |
| project_id | string | ✅       | Project identifier  |
| file_id    | string | ✅       | Uploaded CV file ID |

### Form Data

| Name     | Type   | Required | Description     |
| -------- | ------ | -------- | --------------- |
| job_role | string | ✅       | Target job role |

### Success Response

```json
{
  "signal": "SUCCESS",
  "file_id": "123",
  "data": {
    "skills": ["Python", "Machine Learning"],
    "job_role": "Data Scientist",
    "cluster_id": 4,
    "similar_candidates": ["file22", "file78"],
    "cluster_size": 2
  }
}
```

### Possible Signals

| Signal            | Meaning                             |
| ----------------- | ----------------------------------- |
| FILE_NOT_FOUND    | CV not found                        |
| NO_SKILLS_FOUND   | CV processed but no skills detected |
| PROCESSING_FAILED | Skill extraction failed             |
| CLUSTERING_FAILED | Clustering error                    |

---

## 🔹 2. Cluster Statistics

**GET** `/skills/cluster_stats`

Returns overall clustering metrics.

```json
{
  "signal": "SUCCESS",
  "data": {
    "total_clusters": 8,
    "total_candidates": 154
  }
}
```

---

## 🔹 3. Get Cluster Details

**GET** `/skills/cluster/{cluster_id}`

```json
{
  "signal": "SUCCESS",
  "cluster_id": 2,
  "candidates": ["file1", "file9"],
  "count": 2
}
```

---

## 🔹 4. Reset Clusters

**POST** `/skills/reset_clusters`

⚠️ Deletes all clustering data.

---

## 🔹 5. Reinitialize Clusters

**POST** `/skills/reinitialize_clusters`

Rebuilds clusters using predefined job-role embeddings JSON.

---

## 🔹 6. Evaluate Clustering

**POST** `/skills/evaluate_clustering`

Upload a CSV:

| Column          | Required |
| --------------- | -------- |
| job Id          | ✅       |
| Job Title       | ✅       |
| Job Description | ✅       |

### Response

```json
{
  "signal": "EVALUATION_SUCCESS",
  "total_samples": 120,
  "purity": 0.81,
  "NMI": 0.79,
  "interpretation": "Closer to 1 → better clustering"
}
```

---

# 💼 JOB MANAGEMENT API

`/api/v1/job`

---

## Create Job

**POST** `/job/create/{project_id}`

```json
{
  {
  "job_title": "Senior Full Stack Developer (MERN)",
  "job_description": "We are looking for an experienced Full Stack Developer proficient in MongoDB, Express.js, React, and Node.js. The candidate should have experience with Docker, REST APIs, and AWS cloud services. Knowledge of CI/CD pipelines and unit testing is a plus.",
  "required_skills": [
    "React",
    "Node.js",
    "MongoDB",
    "Express",
    "JavaScript",
    "Docker",
    "REST API",
    "AWS",
    "Git"
  ],
  "required_experience": "3-5 years",
  "required_education": "Bachelor's Degree in Computer Science",
  "applicants": [
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Tasneem-Alaa-CV.pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Shrouk_s_Resume.pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Safwa Ibrahim .pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Habiba_Yousri_Resume_251130_182213.pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Yusuf_Ahmed_CV.pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Ahmed_Elhossieny_CV.pdf",
    "D:/HireVision/Module-1/notebooks/CV_Dataset/Eman_Ashraf_CV.pdf"
  ]
}
}
```

---

## Get All Jobs

**GET** `/job/all/{project_id}`

---

## Get Job by ID

**GET** `/job/{job_id}`

---

## Update Job

**PATCH** `/job/{job_id}`

---

## Delete Job

**DELETE** `/job/{job_id}`

---

## Get Job Rankings

**GET** `/job/{job_id}/rankings`

Returns ranked candidates based on embedding similarity.

---

# 📁 DATA API

`/api/v1/data`

---

## Upload File

**POST** `/data/upload/{project_id}`
**Content-Type:** `multipart/form-data`

| Field | Type |
| ----- | ---- |
| file  | file |

### Response

```json
{
  "signal": "FILE_UPLOAD_SUCCESS",
  "file_id": "file_987"
}
```