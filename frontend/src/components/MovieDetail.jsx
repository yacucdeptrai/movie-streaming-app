"use client"

import { useState } from "react"
import axios from "axios"
import VideoPlayer from "./VideoPlayer"

function MovieDetail({ movie, onBack }) {
  const [resolutions, setResolutions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const handlePlay = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`/api/stream/${movie.movie_id}`)

      const data = response.data
      if (data.resolutions && data.resolutions.length > 0) {
        setResolutions(data.resolutions)
        setIsFullScreen(true)
      } else {
        setError("Không có video khả dụng cho phim này.")
      }
    } catch (err) {
      console.error("Streaming API Error:", err)
      if (err.response?.status === 404) {
        setError("Video chưa được xử lý hoặc không tồn tại.")
      } else {
        setError("Không thể tải video. Vui lòng thử lại sau.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExitFullScreen = () => {
    setIsFullScreen(false)
    setResolutions(null)
  }

  if (resolutions && isFullScreen) {
    return <VideoPlayer resolutions={resolutions} onBack={handleExitFullScreen} movieTitle={movie.title} />
  }

  return (
    <div className="movie-detail">
      {/* Movie Poster & Play Button */}
      <div className="movie-detail-poster">
        <img
          src={movie.thumbnail || `https://picsum.photos/400/600?random=${movie.movie_id}`}
          alt={movie.title}
          onError={(e) => {
            e.target.style.display = "none"
            e.target.parentElement.innerHTML =
              '<div style="display: flex; align-items: center; justify-content: center; height: 400px; background: #333; border-radius: 12px; color: #888; font-size: 4rem;">🎬</div>'
          }}
        />

        {/* Play Button */}
        <button onClick={handlePlay} disabled={loading} className="play-button">
          {loading ? (
            <div
              className="spinner"
              style={{
                width: "30px",
                height: "30px",
                border: "3px solid rgba(255,255,255,0.3)",
                borderTop: "3px solid white",
              }}
            ></div>
          ) : (
            <div className="icon icon-play" style={{ fontSize: "2rem" }}></div>
          )}
        </button>

        {error && (
          <div className="error" style={{ marginTop: "1rem" }}>
            <p className="error-text">{error}</p>
          </div>
        )}
      </div>

      {/* Movie Information */}
      <div className="movie-detail-info">
        <h1>{movie.title}</h1>

        <div className="movie-meta">
          {movie.release_year && (
            <div className="meta-item">
              <span className="icon icon-calendar meta-icon"></span>
              <span>{movie.release_year}</span>
            </div>
          )}

          {movie.genre && (
            <div className="meta-item">
              <span className="icon icon-tag meta-icon"></span>
              <span
                style={{
                  background: "rgba(255, 107, 107, 0.2)",
                  color: "#ff6b6b",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                {movie.genre}
              </span>
            </div>
          )}

          <div className="meta-item">
            <span className="icon icon-star meta-icon"></span>
            <span style={{ color: "#ffd700", fontWeight: "bold" }}>8.5</span>
            <span style={{ color: "#888" }}>(1,234 đánh giá)</span>
          </div>
        </div>

        <div className="movie-detail-description">
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Nội dung phim</h2>
          <p>{movie.description || "Chưa có mô tả cho bộ phim này."}</p>
        </div>

        {/* Additional Info */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
            marginTop: "2rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Thông tin chi tiết</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#b8b8b8" }}>Thể loại:</span>
                <span>{movie.genre || "Chưa cập nhật"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#b8b8b8" }}>Năm sản xuất:</span>
                <span>{movie.release_year || "Chưa cập nhật"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#b8b8b8" }}>Chất lượng:</span>
                <span style={{ color: "#4ade80" }}>HD</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#b8b8b8" }}>Ngôn ngữ:</span>
                <span>Tiếng Việt</span>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem" }}>Tính năng</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "#4ade80" }}>✓</span>
                <span style={{ color: "#b8b8b8" }}>Phát trực tuyến HD</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "#4ade80" }}>✓</span>
                <span style={{ color: "#b8b8b8" }}>Nhiều chất lượng</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "#4ade80" }}>✓</span>
                <span style={{ color: "#b8b8b8" }}>Tương thích mọi thiết bị</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", flexWrap: "wrap" }}>
          <button
            onClick={handlePlay}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "#ff6b6b",
              border: "none",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "1rem",
            }}
            onMouseOver={(e) => (e.target.style.background = "#ee5a24")}
            onMouseOut={(e) => (e.target.style.background = "#ff6b6b")}
          >
            <span className="icon icon-play"></span>
            <span>{loading ? "Đang tải..." : "Xem ngay"}</span>
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "1rem",
            }}
            onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
            onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
          >
            <span>❤️</span>
            <span>Yêu thích</span>
          </button>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              padding: "1rem 2rem",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "1rem",
            }}
            onMouseOver={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
            onMouseOut={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.1)")}
          >
            <span>📤</span>
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MovieDetail
