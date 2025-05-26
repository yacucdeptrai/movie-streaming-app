"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VideoPlayer from "../components/VideoPlayer"
import axios from "axios"

export default function VideoPlayerPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [resolutions, setResolutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovieAndStream = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch movie details
        const movieResponse = await axios.get(`/api/search?query=${movieId}`)
        const movies = movieResponse.data.movies || []
        const foundMovie = movies.find((m) => m.movie_id === movieId) || movies[0]

        if (!foundMovie) {
          setError("Không tìm thấy phim")
          return
        }

        setMovie(foundMovie)

        // Fetch streaming URLs
        const streamResponse = await axios.get(`/api/stream/${movieId}`)
        setResolutions(streamResponse.data.resolutions || [])
      } catch (err) {
        console.error("Error fetching movie stream:", err)
        setError("Không thể tải video. Vui lòng thử lại sau.")
      } finally {
        setLoading(false)
      }
    }

    if (movieId) {
      fetchMovieAndStream()
    }
  }, [movieId])

  const handleBack = () => {
    navigate(`/movie/${movieId}`)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Đang tải video...</p>
        </div>
      </div>
    )
  }

  if (error || !movie || resolutions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white p-8 bg-gray-900 rounded-lg max-w-md">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-6 text-lg">{error || "Không thể tải video"}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
            >
              Thử lại
            </button>
            <button
              onClick={handleBack}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <VideoPlayer resolutions={resolutions} onBack={handleBack} movieTitle={movie.title} />
}
