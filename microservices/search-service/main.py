from dotenv import load_dotenv
import os
from fastapi import FastAPI
import psycopg2

load_dotenv()
app = FastAPI()
DATABASE_URL = os.getenv("DATABASE_URL")

@app.get("/test-db")
def test_db():
    conn = psycopg2.connect(DATABASE_URL)
    return {"message": "Connected to RDS"}