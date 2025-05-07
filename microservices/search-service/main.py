from fastapi import FastAPI, HTTPException
import psycopg2
from psycopg2.extras import RealDictCursor
import os

app = FastAPI()

# Cấu hình kết nối PostgreSQL từ biến môi trường
def get_db_connection():
    conn = psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "movie_db"),
        user=os.getenv("POSTGRES_USER", "admindb"),
        password=os.getenv("POSTGRES_PASSWORD", "admin123"),
        host=os.getenv("POSTGRES_HOST", "movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com"),
        port=os.getenv("POSTGRES_PORT", "5432")
    )
    return conn

# Endpoint: Lấy danh sách phim (tìm kiếm theo tiêu đề)
@app.get("/api/content/movies")
async def search_movies(title: str = ""):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = "SELECT * FROM movies WHERE title ILIKE %s"
    cur.execute(query, (f"%{title}%",))
    movies = cur.fetchall()
    cur.close()
    conn.close()
    if not movies:
        raise HTTPException(status_code=404, detail="No movies found")
    return {"movies": movies}

# Endpoint: Lấy thông tin phim theo movie_id
@app.get("/api/content/movies/{movie_id}")
async def get_movie(movie_id: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM movies WHERE movie_id = %s", (movie_id,))
    movie = cur.fetchone()
    cur.close()
    conn.close()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)