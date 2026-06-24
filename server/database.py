import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

client = AsyncIOMotorClient(
    os.getenv("MONGO_URL"),
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000
)

db = client.authdb
user_collection = db.users
analysis_collection = db.videoanalysis
Notification_collection = db.notifications
# from pymongo import MongoClient
# import certifi

# MONGO_URI = "mongodb+srv://rasagnakudikyala_db_user:XqipxI3hjXzHS6rm@cluster0.ecmucbn.mongodb.net/?appName=Cluster0"

# client = MongoClient(
#     MONGO_URI,
#     tls=True,
#     tlsCAFile=certifi.where()
# )

# db = client.authdb
