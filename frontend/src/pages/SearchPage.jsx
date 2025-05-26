"use client"

import { useState, useEffect } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Search, Filter, Grid, List, Calendar, Star, Play } from "lucide-react"
import axios from "axios"

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [sortBy, setSortBy] = useState("newest") // newest, oldest, name
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const limit = 12

  useEffect(() => {
    const query = searchParams.get("q")
    if (query) {
      setSearchQuery(query)
      setPage(1)
    }
  }, [searchParams])

  useEffect(() => {
    fetchMovies()
  }, [searchQuery, page, sortBy])

  const fetchMovies = async () => {
    try {
      setLoading(true)

      const params = {
        page: page.toString(),
        limit: limit.toString(),
      }

      if (searchQuery) {
        params.query = searchQuery
      }

      const response = await axios.get("/api/search", { params })
      const fetchedMovies = response.data.movies || []

      // Client-side sorting (since API might not support it)
      if (sortBy === "name") {
        fetchedMovies.sort((a, b) => a.title.localeCompare(b.title))
      } else if (sortBy === "oldest") {
        fetchedMovies.sort((a, b) => (a.release_year || 0) - (b.release_year || 0))
      } else {
        fetchedMovies.sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
      }

      setMovies(fetchedMovies)
      setTotalPages(response.data.pagination?.total_pages || 1)
    } catch (error) {
      console.error("Error fetching movies:", error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() })
      setPage(1)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const MovieGridItem = ({ movie }) => (
    <Link
      to={`/movie/${movie.movie_id}`}
      className="group relative overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl aspect-poster"
    >
      <img
        src={movie.thumbnail || "/placeholder.svg?height=400&width=300"}
        alt={movie.title}
        className="w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold mb-2 line-clamp-2">{movie.title}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-300 mb-3">
            {movie.release_year && (
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{movie.release_year}</span>
              </span>
            )}
            {movie.genre && (
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{movie.genre}</span>
              </span>
            )}
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
            <Play className="h-3 w-3" />
            <span>Xem ngay</span>
          </button>
        </div>
      </div>

      {movie.release_year && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          {movie.release_year}
        </div>
      )}
    </Link>
  )

  const MovieListItem = ({ movie }) => (
    <Link
      to={`/movie/${movie.movie_id}`}
      className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
    >
      <div className="w-24 h-36 flex-shrink-0">
        <img
          src={movie.thumbnail || "/placeholder.svg?height=144&width=96"}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 p-4">
        <h3 className="text-white font-semibold text-lg mb-2">{movie.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{movie.description}</p>
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          {movie.release_year && (
            <span className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{movie.release_year}</span>
            </span>
          )}
          {movie.genre && (
            <span className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{movie.genre}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center p-4">
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
          <Play className="h-4 w-4" />
          <span>Xem</span>
        </button>
      </div>
    </Link>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </form>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>

            {searchQuery && (
              <div className="text-sm text-gray-400">
                Kết quả cho: <span className="text-white font-medium">"{searchQuery}"</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tìm kiếm...</p>
          </div>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {searchQuery ? "Không tìm thấy kết quả" : "Nhập từ khóa để tìm kiếm"}
          </h3>
          <p className="text-gray-500">
            {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Tìm kiếm phim yêu thích của bạn"}
          </p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              Tìm thấy <span className="text-white font-medium">{movies.length}</span> kết quả
              {searchQuery && <span> cho "{searchQuery}"</span>}
            </p>
          </div>

          {/* Movies Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
              {movies.map((movie) => (
                <MovieGridItem key={movie.movie_id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {movies.map((movie) => (
                <MovieListItem key={movie.movie_id} movie={movie} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
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
                      className={`px-3 py-2 rounded transition-colors ${
                        page === pageNum ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
