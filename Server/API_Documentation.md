**Base URL:**

```
http://127.0.0.1:8000/api/v1/
```

**Description:**
This API manages:

* Users (jobseekers & recruiters)
* Job postings & rankings
* Applications & feedback
* CV uploads, processing, and text extraction
* Skills extraction, clustering, and evaluation

---

# 🧑‍💻 USER MANAGEMENT API

**Base Path:** `/user`

| Endpoint          | Method | Description                             |
| ----------------- | ------ | --------------------------------------- |
| `/user/create`    | POST   | Create a new user (jobseeker/recruiter) |
| `/user/{user_id}` | GET    | Get user by ID                          |
| `/user/{user_id}` | PATCH  | Update user                             |
| `/user/{user_id}` | DELETE | Delete user                             |

---

### 1. Create User

**POST** `/user/create`

**Body (JSON)**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "jobseeker", 
  "company_name": "Optional if recruiter"
}
```

**Responses**

| Signal                | Meaning                             |
| --------------------- | ----------------------------------- |
| SUCCESS               | User created                        |
| USER_ALREADY_EXISTS   | Email already registered            |
| INVALID_ROLE          | Role not allowed                    |
| COMPANY_NAME_REQUIRED | Recruiter must provide company_name |

---

### 2. Get User

**GET** `/user/{user_id}`

**Path Parameters**

| Name    | Type   | Required | Description             |
| ------- | ------ | -------- | ----------------------- |
| user_id | string | ✅        | User ObjectId or string |

**Response Example**

```json
{
  "id": "64f1b3c0c0f1ab009876abcd",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "jobseeker",
  "created_at": "2025-03-06T12:34:56.789Z"
}
```

---

### 3. Update User

**PATCH** `/user/{user_id}`

**Body (JSON)** – only fields to update

```json
{
  "name": "John Updated",
  "company_name": "New Company Name"
}
```

---

### 4. Delete User

**DELETE** `/user/{user_id}`

**Response**

| Signal         | Meaning              |
| -------------- | -------------------- |
| SUCCESS        | Deleted successfully |
| USER_NOT_FOUND | User does not exist  |

---

# 💼 JOB MANAGEMENT API

**Base Path:** `/job`

| Endpoint                               | Method | Description                  |
| -------------------------------------- | ------ | ---------------------------- |
| `/job/create/{recruiter_id}`           | POST   | Create a new job             |
| `/job/all`                             | GET    | Get all jobs                 |
| `/job/{job_id}`                        | GET    | Get job by ID                |
| `/job/{job_id}`                        | PATCH  | Update job                   |
| `/job/{job_id}`                        | DELETE | Delete job                   |
| `/job/recruiter/{recruiter_id}`        | GET    | Get jobs by recruiter        |
| `/job/recruiter/{recruiter_id}/delete` | DELETE | Delete all jobs by recruiter |
| `/job/cluster/{cluster_id}`            | GET    | Get jobs by cluster          |
| `/job/{job_id}/rankings`               | GET    | Get ranked CVs for a job     |

---

### 1. Create Job

**POST** `/job/create/{recruiter_id}`

**Body Example**

```json
{
  "job_title": "Senior Full Stack Developer",
  "job_description": "Looking for an experienced MERN developer...",
  "required_skills": ["React", "Node.js", "MongoDB"],
  "required_experience": "3-5 years",
  "required_education": "Bachelor's Degree",
  "applicants": ["file1.pdf", "file2.pdf"]
}
```

**Errors:** `JOB_ALREADY_EXISTS`

---

### 2. Get All Jobs

**GET** `/job/all`

---

### 3. Get Job by ID

**GET** `/job/{job_id}`

**Errors:** `JOB_NOT_FOUND`

---

### 4. Update Job

**PATCH** `/job/{job_id}`

**Body Example:** only include fields to update

```json
{
  "job_title": "Updated Job Title",
  "required_skills": ["Python", "Django"]
}
```

---

### 5. Delete Job

**DELETE** `/job/{job_id}`

**Errors:** `JOB_NOT_FOUND`

---

### 6. Get Jobs by Recruiter

**GET** `/job/recruiter/{recruiter_id}`

---

### 7. Delete All Jobs by Recruiter

**DELETE** `/job/recruiter/{recruiter_id}/delete`

**Response Example**

```json
{
  "signal": "SUCCESS",
  "deleted_count": 5
}
```

---

### 8. Get Jobs by Cluster

**GET** `/job/cluster/{cluster_id}`

---

### 9. Get Ranked CVs for a Job

**GET** `/job/{job_id}/rankings`

**Query / Config Parameters:**

* `config`: dict with ranking weights, thresholds
* `faiss_service_cv` & `faiss_service_job` required backend

**Response Example**

```json
[
  {
    "cv_id": "64f1b3c0c0f1ab009876abcd",
    "final_score": 0.92,
    "details": {
      "matched_skills": ["Python", "ML"],
      "missing_skills": ["Docker"]
    },
    "cv_feedback_url": "https://res.cloudinary.com/feedbacks/file.pdf"
  }
]
```

---

# 📝 APPLICATION MANAGEMENT API

**Base Path:** `/application`

| Endpoint                                        | Method | Description                                 |
| ----------------------------------------------- | ------ | ------------------------------------------- |
| `/application/create`                           | POST   | Create a new application                    |
| `/application/{application_id}`                 | GET    | Get application by ID                       |
| `/application/job/{job_id}`                     | GET    | Get applications for a job                  |
| `/application/candidate/{candidate_id}`         | GET    | Get applications for candidate              |
| `/application/status/{status}`                  | GET    | Get applications by status                  |
| `/application/{application_id}/update_matching` | PATCH  | Update matching result                      |
| `/application/{application_id}/update_status`   | PATCH  | Update status                               |
| `/application/{application_id}`                 | DELETE | Delete application                          |
| `/application/user/{user_id}/delete`            | DELETE | Delete applications by user                 |
| `/application/recruiter/{recruiter_id}/delete`  | DELETE | Delete all applications by recruiter’s jobs |

---

# 📁 DATA & FILE API

**Base Path:** `/data`

| Endpoint                    | Method | Description           |
| --------------------------- | ------ | --------------------- |
| `/data/upload/{project_id}` | POST   | Upload file (PDF/TXT) |

**Validation:**

* Allowed types: `self.app_settings.FILE_ALLOWED_TYPES`
* Max size: `self.app_settings.FILE_MAX_SIZE` MB

**Response Example**

```json
{
  "signal": "FILE_UPLOAD_SUCCESS",
  "file_id": "file_987"
}
```

---

# 📊 SKILLS & CLUSTERING API

**Base Path:** `/skills`

| Endpoint                                    | Method | Description                               |
| ------------------------------------------- | ------ | ----------------------------------------- |
| `/skills/process_cv/{project_id}/{file_id}` | POST   | Extract skills and assign cluster         |
| `/skills/cluster_stats`                     | GET    | Get cluster statistics                    |
| `/skills/cluster/{cluster_id}`              | GET    | Get candidates in cluster                 |
| `/skills/reset_clusters`                    | POST   | Reset all clusters                        |
| `/skills/reinitialize_clusters`             | POST   | Reinitialize clusters from job embeddings |
| `/skills/evaluate_clustering`               | POST   | Evaluate clustering quality               |

---

# ⚠️ Error Signals

| Signal                  | Meaning                  |
| ----------------------- | ------------------------ |
| USER_ALREADY_EXISTS     | User exists              |
| JOB_ALREADY_EXISTS      | Job exists               |
| JOB_NOT_FOUND           | Job not found            |
| APPLICATION_NOT_FOUND   | Application not found    |
| FILE_TYPE_NOT_SUPPORTED | Upload rejected          |
| FILE_SIZE_EXCEEDED      | Upload rejected          |
| PROCESSING_FAILED       | CV processing failed     |
| CLUSTERING_FAILED       | Skills clustering failed |

