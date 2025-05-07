from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Query
import psycopg2
from dotenv import load_dotenv
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Kết nối với PostgreSQL
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# API endpoint để tìm kiếm và phân trang phim
@app.get("/api/search")
async def search_movies(
    query: str = Query(None, description="Từ khóa tìm kiếm trong tiêu đề hoặc mô tả"),
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    limit: int = Query(10, ge=1, le=100, description="Số lượng phim mỗi trang (tối đa 100)")
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Tính offset cho phân trang
        offset = (page - 1) * limit

        # Truy vấn cơ bản
        base_query = "SELECT movie_id, title, description FROM movies"
        count_query = "SELECT COUNT(*) FROM movies"
        params = []

        # Nếu có từ khóa tìm kiếm
        if query:
            base_query += " WHERE (title ILIKE %s OR description ILIKE %s)"
            count_query += " WHERE (title ILIKE %s OR description ILIKE %s)"
            search_term = f"%{query}%"
            params.extend([search_term, search_term])

        # Thêm phân trang
        base_query += " ORDER BY movie_id LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        # Đếm tổng số phim
        cursor.execute(count_query, params[:2] if query else [])
        total_movies = cursor.fetchone()[0]

        # Lấy danh sách phim
        cursor.execute(base_query, params)
        movies = cursor.fetchall()

        # Đóng kết nối
        cursor.close()
        conn.close()

        # Chuẩn bị phản hồi
        response = {
            "movies": [{"movie_id": str(movie[0]), "title": movie[1], "description": movie[2]} for movie in movies],
            "pagination": {
                "current_page": page,
                "limit": limit,
                "total_movies": total_movies,
                "total_pages": (total_movies + limit - 1) // limit
            }
        }
        return response

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)