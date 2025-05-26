"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function MovieList({ onSelectMovie }) {
  const [movies, setMovies] = useState([])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 })
  const [loading, setLoading] = useState(false)

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/search", {
        params: { query: query || undefined, page, limit },
      })

      const moviesData = response.data?.movies || []
      const paginationData = response.data?.pagination || { current_page: 1, total_pages: 1 }

      setMovies(Array.isArray(moviesData) ? moviesData : [])
      setPagination(paginationData)
    } catch (error) {
      console.error("Error fetching movies:", error)
      setMovies([])
      setPagination({ current_page: 1, total_pages: 1 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [query, page])

  const handleSearch = (e) => {
    setQuery(e.target.value)
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPage(newPage)
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <h1>Khám Phá Thế Giới Điện Ảnh</h1>
        <p>Thưởng thức hàng nghìn bộ phim chất lượng cao với trải nghiệm xem tuyệt vời</p>
      </div>

      {/* Search Section */}
      <div className="search-container">
        <div className="icon icon-search search-icon"></div>
        <input
          type="text"
          placeholder="Tìm kiếm phim yêu thích của bạn..."
          value={query}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Stats */}
      {!loading && movies && movies.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              color: "#b8b8b8",
            }}
          >
            Tìm thấy{" "}
            <span style={{ color: "#ff6b6b", fontWeight: "bold" }}>{pagination.total_movies || movies.length}</span>{" "}
            phim
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div style={{ minHeight: "400px" }}>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải phim...</p>
          </div>
        ) : !movies || movies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3 className="empty-title">Không tìm thấy phim nào</h3>
            <p className="empty-description">Thử tìm kiếm với từ khóa khác hoặc xem tất cả phim</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((movie) => (
              <div key={movie.movie_id} className="movie-card" onClick={() => onSelectMovie(movie)}>
                <div className="movie-poster">
                  <img
                    src={movie.thumbnail || `https://picsum.photos/300/450?random=${movie.movie_id}`}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.style.display = "none"
                      e.target.parentElement.innerHTML =
                        '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 3rem;">🎬</div>'
                    }}
                  />
                  <div className="play-overlay">
                    <div className="icon icon-play play-icon"></div>
                  </div>
                </div>

                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                  <p className="movie-description">{movie.description}</p>
                  {movie.genre && <span className="movie-genre">{movie.genre}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && movies && movies.length > 0 && pagination.total_pages > 1 && (
        <div className="pagination">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="pagination-btn">
            <span className="icon icon-back"></span> Trước
          </button>

          {[...Array(Math.min(5, pagination.total_pages))].map((_, i) => {
            const pageNum = i + 1
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`pagination-btn ${page === pageNum ? "active" : ""}`}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.total_pages}
            className="pagination-btn"
          >
            Sau <span className="icon icon-back" style={{ transform: "rotate(180deg)" }}></span>
          </button>
        </div>
      )}
    </div>
  )
}

export default MovieList
