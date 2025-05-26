"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Film, Grid, Star, Calendar, Play } from "lucide-react"
import axios from "axios"

export default function CategoryPage() {
  const { categoryId } = useParams()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 12

  const categoryInfo = {
    "phim-le": {
      title: "Phim Lẻ",
      description: "Những bộ phim lẻ hay nhất",
      icon: <Film className="h-8 w-8" />,
      color: "blue",
    },
    "phim-bo": {
      title: "Phim Bộ",
      description: "Những bộ phim bộ hấp dẫn",
      icon: <Grid className="h-8 w-8" />,
      color: "green",
    },
    "chieu-rap": {
      title: "Phim Chiếu Rạp",
      description: "Những bộ phim chiếu rạp mới nhất",
      icon: <Star className="h-8 w-8" />,
      color: "yellow",
    },
  }

  const currentCategory = categoryInfo[categoryId] || {
    title: "Danh mục",
    description: "Danh sách phim",
    icon: <Film className="h-8 w-8" />,
    color: "gray",
  }

  useEffect(() => {
    fetchCategoryMovies()
  }, [categoryId, page])

  const fetchCategoryMovies = async () => {
    try {
      setLoading(true)

      const params = {
        page: page.toString(),
        limit: limit.toString(),
      }

      // You might want to add category filtering to your API
      // For now, we'll fetch all movies and filter client-side
      const response = await axios.get("/api/search", { params })
      setMovies(response.data.movies || [])
      setTotalPages(response.data.pagination?.total_pages || 1)
    } catch (error) {
      console.error("Error fetching category movies:", error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-600 to-blue-800 text-blue-400",
      green: "from-green-600 to-green-800 text-green-400",
      yellow: "from-yellow-600 to-yellow-800 text-yellow-400",
      gray: "from-gray-600 to-gray-800 text-gray-400",
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Category Header */}
      <div
        className={`bg-gradient-to-r ${getColorClasses(currentCategory.color).split(" ")[0]} ${getColorClasses(currentCategory.color).split(" ")[1]} rounded-lg p-8 mb-8`}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className={`${getColorClasses(currentCategory.color).split(" ")[2]}`}>{currentCategory.icon}</div>
          <div>
            <h1 className="text-3xl font-bold text-white">{currentCategory.title}</h1>
            <p className="text-gray-200">{currentCategory.description}</p>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải phim...</p>
          </div>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <Film className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa có phim nào</h3>
          <p className="text-gray-500">Danh mục này hiện chưa có phim. Hãy quay lại sau!</p>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              Có <span className="text-white font-medium">{movies.length}</span> phim trong danh mục này
            </p>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
            {movies.map((movie) => (
              <Link
                key={movie.movie_id}
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
            ))}
          </div>

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
