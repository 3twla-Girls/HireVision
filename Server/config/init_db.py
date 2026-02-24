from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="../.env")

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

print("Connected to DB:", db.name)

collections = [
    "users",
    "jobs",
    "questions_with_answers",
    "interview_sessions"
]

for col in collections:
    if col not in db.list_collection_names():
        db.create_collection(col)
        print(f"Created collection: {col}")