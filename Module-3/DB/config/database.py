from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv("/home/bebo/Documents/HireVision-GP/HireVision/Module-3/.env")
client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]

questions_collection = db["questions_with_answers"]
jobs_collection = db["jobs"]
