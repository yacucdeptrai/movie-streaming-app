import psycopg2

conn = psycopg2.connect(
    dbname="movie_db",
    user="admindb",
    password="admin123",
    host="microservices/search-service/create_table.py",
    port="5432"
)
cur = conn.cursor()
cur.execute("""
    INSERT INTO movies (movie_id, title, description, release_year)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (movie_id) DO NOTHING;
""", ("1", "Phim Hành Động 2023", "Một bộ phim hành động kịch tính", 2023))
conn.commit()
cur.close()
conn.close()