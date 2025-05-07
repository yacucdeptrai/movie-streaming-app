import psycopg2

# Kết nối với PostgreSQL trên Amazon RDS
conn = psycopg2.connect(
    dbname="movie_db",
    user="admindb",
    password="admin123",
    host="movie-db.cohuqu6m26h2.us-east-1.rds.amazonaws.com",
    port="5432"
)
cur = conn.cursor()

# Tạo bảng movies
cur.execute("""
    CREATE TABLE IF NOT EXISTS movies (
        movie_id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        release_year INT
    );
""")
conn.commit()
cur.close()
conn.close()