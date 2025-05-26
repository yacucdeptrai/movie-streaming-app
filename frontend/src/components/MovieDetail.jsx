"use client"

import { useState } from "react"
import { ArrowLeft, Play, Calendar, Tag, Loader2 } from "lucide-react"
import VideoPlayer from "./VideoPlayer"
import axios from "axios"

export default function MovieDetail({ movie, onBack }) {
  const [resolutions, setResolutions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use absolute path - Kong will route this
      const response = await axios.get(`/api/stream/${movie.movie_id}`)
      setResolutions(response.data.resolutions || [])
      setIsPlaying(true)
    } catch (err) {
      console.error("Streaming API Error:", err)
      setError("Không thể tải video. Vui lòng thử lại sau.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDetail = () => {
    setIsPlaying(false)
    setResolutions([])
    setError(null)
  }

  if (isPlaying && resolutions.length > 0) {
    return <VideoPlayer resolutions={resolutions} onBack={handleBackToDetail} movieTitle={movie.title} />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div style={{ position: "relative" }}>
        {/* Background Image */}
        <div style={{ position: "absolute", inset: "0", zIndex: "0" }}>
          <img
            src={movie.thumbnail || "/placeholder.svg?height=600&width=1200"}
            alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: "0",
              background: "linear-gradient(to top, #111827, rgba(17, 24, 39, 0.8), rgba(17, 24, 39, 0.4))",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ position: "relative", zIndex: "10" }} className="container py-8">
          {/* Back Button */}
          <button onClick={onBack} className="btn btn-outline mb-6">
            <ArrowLeft style={{ height: "1rem", width: "1rem", marginRight: "0.5rem" }} />
            Quay lại
          </button>

          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
            {/* Movie Poster */}
            <div>
              <div className="card" style={{ backgroundColor: "rgba(31, 41, 55, 0.8)", backdropFilter: "blur(4px)" }}>
                <div className="aspect-poster relative">
                  <img
                    src={movie.thumbnail || "/placeholder.svg?height=600&width=400"}
                    alt={movie.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold mb-4 text-white">{movie.title}</h1>

                <div className="flex items-center gap-3 mb-6" style={{ flexWrap: "wrap" }}>
                  {movie.genre && (
                    <span
                      className="bg-blue-600 text-white px-3 py-1"
                      style={{ borderRadius: "9999px", fontSize: "0.875rem", display: "flex", alignItems: "center" }}
                    >
                      <Tag style={{ height: "0.75rem", width: "0.75rem", marginRight: "0.25rem" }} />
                      {movie.genre}
                    </span>
                  )}
                  {movie.release_year && (
                    <span
                      style={{
                        border: "1px solid #4b5563",
                        color: "#d1d5db",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Calendar style={{ height: "0.75rem", width: "0.75rem", marginRight: "0.25rem" }} />
                      {movie.release_year}
                    </span>
                  )}
                </div>

                <p className="text-gray-300 mb-8" style={{ fontSize: "1.125rem", lineHeight: "1.75" }}>
                  {movie.description}
                </p>

                {/* Play Button */}
                <div className="space-y-4">
                  <button
                    onClick={handlePlay}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      padding: "0.75rem 2rem",
                      fontSize: "1.125rem",
                      opacity: loading ? "0.5" : "1",
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2
                          style={{ height: "1.25rem", width: "1.25rem", marginRight: "0.5rem" }}
                          className="animate-spin"
                        />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Play style={{ height: "1.25rem", width: "1.25rem", marginRight: "0.5rem" }} />
                        Xem phim
                      </>
                    )}
                  </button>

                  {error && <div style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="container py-8">
        <div className="card">
          <div style={{ padding: "1.5rem" }}>
            <h2 className="text-2xl font-bold mb-4">Thông tin chi tiết</h2>
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">Tên phim</h3>
                <p className="text-white">{movie.title}</p>
              </div>
              {movie.genre && (
                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">Thể loại</h3>
                  <p className="text-white">{movie.genre}</p>
                </div>
              )}
              {movie.release_year && (
                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">Năm phát hành</h3>
                  <p className="text-white">{movie.title}</p>
                </div>
              )}
              <div style={{ gridColumn: "span 2" }}>
                <h3 className="font-semibold text-gray-300 mb-2">Mô tả</h3>
                <p className="text-white" style={{ lineHeight: "1.75" }}>
                  {movie.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
