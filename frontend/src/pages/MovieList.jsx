"use client"

import { useState, useEffect } from "react"
import { Calendar, Star, Play, ChevronLeft, ChevronRight } from "lucide-react"
import axios from "axios"

export default function MovieList({ onSelectMovie, searchQuery, activeCategory }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState(null)
  const limit = 12

  const fetchMovies = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        page: page.toString(),
        limit: limit.toString(),
      }

      if (searchQuery) {
        params.query = searchQuery
      }

      // Use absolute path - Kong will route this
      const response = await axios.get("/api/search", { params })
      setMovies(response.data.movies || [])
      setTotalPages(response.data.pagination?.total_pages || 1)
    } catch (err) {
      console.error("API Error:", err)
      setError("Không thể tải danh sách phim. Vui lòng thử lại sau.")
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies()
  }, [searchQuery, activeCategory, page])

  useEffect(() => {
    setPage(1) // Reset to first page when search or category changes
  }, [searchQuery, activeCategory])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const MovieSkeleton = () => (
    <div className="card animate-spin">
      <div style={{ width: "100%", height: "16rem", backgroundColor: "#374151" }}></div>
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            height: "1.5rem",
            width: "75%",
            marginBottom: "0.5rem",
            backgroundColor: "#374151",
            borderRadius: "0.25rem",
          }}
        ></div>
        <div
          style={{
            height: "1rem",
            width: "100%",
            marginBottom: "0.5rem",
            backgroundColor: "#374151",
            borderRadius: "0.25rem",
          }}
        ></div>
        <div style={{ height: "1rem", width: "50%", backgroundColor: "#374151", borderRadius: "0.25rem" }}></div>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="text-center py-8">
        <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>
        <button onClick={fetchMovies} className="btn btn-outline">
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Danh sách phim"}</h2>
        {!loading && movies.length > 0 && (
          <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Trang {page} / {totalPages} ({movies.length} phim)
          </div>
        )}
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <MovieSkeleton key={index} />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-8">
          <div style={{ color: "#9ca3af", marginBottom: "1rem" }}>
            {searchQuery ? "Không tìm thấy phim nào phù hợp" : "Không có phim nào để hiển thị"}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {movies.map((movie) => (
            <div
              key={movie.movie_id}
              className="card cursor-pointer"
              onClick={() => onSelectMovie(movie)}
              style={{ transition: "all 0.3s" }}
            >
              {/* Movie Poster */}
              <div className="relative aspect-poster overflow-hidden">
                <img
                  src={movie.thumbnail || "/placeholder.svg?height=400&width=300"}
                  alt={movie.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: "0",
                    backgroundColor: "rgba(0,0,0,0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                  }}
                >
                  <Play style={{ color: "white", opacity: "0", width: "3rem", height: "3rem" }} />
                </div>
                {movie.release_year && (
                  <span
                    style={{
                      position: "absolute",
                      top: "0.5rem",
                      right: "0.5rem",
                      backgroundColor: "#2563eb",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    {movie.release_year}
                  </span>
                )}
              </div>

              {/* Movie Info */}
              <div style={{ padding: "1rem" }}>
                <h3 className="font-semibold text-xl mb-2 line-clamp-2" style={{ color: "#60a5fa" }}>
                  {movie.title}
                </h3>
                <p className="text-gray-400 mb-3 line-clamp-2" style={{ fontSize: "0.875rem" }}>
                  {movie.description}
                </p>
                <div className="flex items-center justify-between" style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {movie.genre && (
                    <div className="flex items-center space-x-1">
                      <Star style={{ height: "0.75rem", width: "0.75rem" }} />
                      <span>{movie.genre}</span>
                    </div>
                  )}
                  {movie.release_year && (
                    <div className="flex items-center space-x-1">
                      <Calendar style={{ height: "0.75rem", width: "0.75rem" }} />
                      <span>{movie.release_year}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && movies.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2" style={{ paddingTop: "2rem" }}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="btn btn-outline"
            style={{ opacity: page === 1 ? "0.5" : "1", cursor: page === 1 ? "not-allowed" : "pointer" }}
          >
            <ChevronLeft style={{ height: "1rem", width: "1rem", marginRight: "0.25rem" }} />
            Trước
          </button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn ${page === pageNum ? "btn-primary" : "btn-outline"}`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="btn btn-outline"
            style={{
              opacity: page === totalPages ? "0.5" : "1",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Sau
            <ChevronRight style={{ height: "1rem", width: "1rem", marginLeft: "0.25rem" }} />
          </button>
        </div>
      )}
    </div>
  )
}
