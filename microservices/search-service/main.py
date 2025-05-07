from fastapi import FastAPI
import psycopg2
from dotenv import load_dotenv
import os

app = FastAPI()

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Kết nối với PostgreSQL
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# API endpoint để lấy danh sách phim
@app.get("/api/search")
async def search_movies():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT movie_id, title, description FROM movies")
        movies = cursor.fetchall()
        cursor.close()
        conn.close()
        return [{"movie_id": str(movie[0]), "title": movie[1], "description": movie[2]} for movie in movies]
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)