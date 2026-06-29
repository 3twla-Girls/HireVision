from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv(".env")

print("URL:", os.getenv("MONGODB_URL"))
print("DB:", os.getenv("MONGODB_DATABASE"))

client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("MONGODB_DATABASE")]

print("Connected to DB:", db.name)

collections = [
    "CVs",
    "candidates",
    "jobs",
    "applications",
    "users",
    "questions_with_answers",
    "interview_sessions"
]

for col in collections:
    if col not in db.list_collection_names():
        db.create_collection(col)
        print(f"Created collection: {col}")

