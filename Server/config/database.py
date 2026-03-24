from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv("Server/.env")
client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("MONGODB_DATABASE")]

questions_collection = db["questions_with_answers"]
jobs_collection = db["jobs"]
interview_sessions=db["interview_sessions"]