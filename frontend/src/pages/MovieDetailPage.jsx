"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Play, Calendar, Tag, Clock, Star, Share2 } from "lucide-react"
import axios from "axios"

export default function MovieDetailPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [relatedMovies, setRelatedMovies] = useState([])

  useEffect(() => {
    const fetchMovieDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch movie details (you might need to create this endpoint)
        const response = await axios.get(`/api/search?query=${movieId}`)
        const movies = response.data.movies || []
        const foundMovie = movies.find((m) => m.movie_id === movieId) || movies[0]

        if (foundMovie) {
          setMovie(foundMovie)

          // Fetch related movies
          if (foundMovie.genre) {
            const relatedResponse = await axios.get(`/api/search?query=${foundMovie.genre}&limit=6`)
            const related = (relatedResponse.data.movies || []).filter((m) => m.movie_id !== movieId)
            setRelatedMovies(related)
          }
        } else {
          setError("Không tìm thấy phim")
        }
      } catch (err) {
        console.error("Error fetching movie detail:", err)
        setError("Lỗi tải thông tin phim")
      } finally {
        setLoading(false)
      }
    }

    if (movieId) {
      fetchMovieDetail()
    }
  }, [movieId])

  const handleWatchMovie = () => {
    navigate(`/watch/${movieId}`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: movie.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("Đã sao chép link phim!")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải thông tin phim...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">{error || "Không tìm thấy phim"}</h3>
          <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Quay về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.thumbnail || "/placeholder.svg?height=600&width=1200"}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors mb-6 backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* Movie Poster */}
            <div className="md:col-span-1">
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden">
                <div className="aspect-poster relative">
                  <img
                    src={movie.thumbnail || "/placeholder.svg?height=600&width=400"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4 text-white">{movie.title}</h1>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {movie.genre && (
                    <span className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      <Tag className="h-3 w-3" />
                      <span>{movie.genre}</span>
                    </span>
                  )}
                  {movie.release_year && (
                    <span className="flex items-center space-x-1 border border-gray-400 text-gray-300 px-3 py-1 rounded-full text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{movie.release_year}</span>
                    </span>
                  )}
                  <span className="flex items-center space-x-1 border border-gray-400 text-gray-300 px-3 py-1 rounded-full text-sm">
                    <Clock className="h-3 w-3" />
                    <span>HD</span>
                  </span>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-8">{movie.description}</p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleWatchMovie}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                  >
                    <Play className="h-5 w-5" />
                    <span>Xem phim</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Thông tin chi tiết</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Tên phim</h3>
              <p className="text-white mb-4">{movie.title}</p>
            </div>
            {movie.genre && (
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Thể loại</h3>
                <p className="text-white mb-4">{movie.genre}</p>
              </div>
            )}
            {movie.release_year && (
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Năm phát hành</h3>
                <p className="text-white mb-4">{movie.release_year}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-300 mb-2">Mô tả</h3>
              <p className="text-white leading-relaxed">{movie.description}</p>
            </div>
          </div>
        </div>

        {/* Related Movies */}
        {relatedMovies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <span>Phim liên quan</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <Link
                  key={relatedMovie.movie_id}
                  to={`/movie/${relatedMovie.movie_id}`}
                  className="group relative overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 aspect-poster"
                >
                  <img
                    src={relatedMovie.thumbnail || "/placeholder.svg?height=400&width=300"}
                    alt={relatedMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-medium text-sm line-clamp-2">{relatedMovie.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
