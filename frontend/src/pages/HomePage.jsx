"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Play, Calendar, Star, TrendingUp, Clock, Film } from "lucide-react"
import axios from "axios"

export default function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState([])
  const [recentMovies, setRecentMovies] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true)

        // Fetch different sections
        const [featuredRes, recentRes, popularRes] = await Promise.all([
          axios.get("/api/search?limit=6"),
          axios.get("/api/search?limit=8"),
          axios.get("/api/search?limit=8"),
        ])

        setFeaturedMovies(featuredRes.data.movies || [])
        setRecentMovies(recentRes.data.movies || [])
        setPopularMovies(popularRes.data.movies || [])
      } catch (error) {
        console.error("Error fetching home data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  const MovieCard = ({ movie, size = "normal" }) => (
    <Link
      to={`/movie/${movie.movie_id}`}
      className={`group relative overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        size === "large" ? "aspect-video" : "aspect-poster"
      }`}
    >
      <img
        src={movie.thumbnail || "/placeholder.svg?height=400&width=300"}
        alt={movie.title}
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">{movie.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-300 mb-3">
            {movie.release_year && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{movie.release_year}</span>
              </div>
            )}
            {movie.genre && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4" />
                <span>{movie.genre}</span>
              </div>
            )}
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Play className="h-4 w-4" />
            <span>Xem ngay</span>
          </button>
        </div>
      </div>

      {/* Quality Badge */}
      {movie.release_year && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
          {movie.release_year}
        </div>
      )}
    </Link>
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      {featuredMovies.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-6 flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <span>Phim nổi bật</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredMovies.slice(0, 6).map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} size="large" />
            ))}
          </div>
        </section>
      )}

      {/* Recent Movies */}
      {recentMovies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Clock className="h-6 w-6 text-green-500" />
              <span>Phim mới cập nhật</span>
            </h2>
            <Link to="/search" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentMovies.slice(0, 8).map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Movies */}
      {popularMovies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <span>Phim được yêu thích</span>
            </h2>
            <Link to="/search" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularMovies.slice(0, 8).map((movie) => (
              <MovieCard key={movie.movie_id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && featuredMovies.length === 0 && recentMovies.length === 0 && popularMovies.length === 0 && (
        <div className="text-center py-16">
          <Film className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Chưa có phim nào</h3>
          <p className="text-gray-500">Hãy quay lại sau để xem những bộ phim mới nhất!</p>
        </div>
      )}
    </div>
  )
}
