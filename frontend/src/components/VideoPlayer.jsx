"use client"

import { useState, useEffect, useRef } from "react"
import Hls from "hls.js"

export default function VideoPlayer({ resolutions, onBack, movieTitle }) {
  const videoRef = useRef(null)
  const [currentQuality, setCurrentQuality] = useState("auto")
  const [hls, setHls] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)

  // Auto-hide controls
  useEffect(() => {
    let timeout
    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    const handleMouseMove = () => resetTimeout()

    document.addEventListener("mousemove", handleMouseMove)
    resetTimeout()

    return () => {
      clearTimeout(timeout)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Initialize with auto quality
  useEffect(() => {
    if (resolutions && resolutions.length > 0) {
      console.log("Available resolutions:", resolutions)
      setCurrentQuality("720p") // Default to 720p
    }
  }, [resolutions])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !resolutions || resolutions.length === 0) {
      return
    }

    const initializePlayer = () => {
      setIsLoading(true)
      setError(null)

      if (hls) {
        hls.destroy()
      }

      const selectedResolution = resolutions.find((res) => res.quality === currentQuality) || resolutions[0]

      console.log("Loading video:", selectedResolution.quality, selectedResolution.url)

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          autoStartLoad: true,
          startLevel: -1,
        })

        hlsInstance.loadSource(selectedResolution.url)
        hlsInstance.attachMedia(video)

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false)
          video.play().catch((error) => {
            console.error("Error playing video:", error)
            setError("Không thể tự động phát video. Vui lòng nhấn nút Play.")
          })
        })

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", event, data)
          if (data.fatal) {
            setError("Lỗi tải video. URL có thể đã hết hạn.")
            setIsLoading(false)
          }
        })

        setHls(hlsInstance)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selectedResolution.url
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false)
          video.play().catch((error) => {
            console.error("Error playing video:", error)
            setError("Không thể tự động phát video. Vui lòng nhấn nút Play.")
          })
        })
      } else {
        setError("Trình duyệt không hỗ trợ phát video HLS.")
        setIsLoading(false)
      }
    }

    initializePlayer()

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [currentQuality, resolutions])

  const handleQualityChange = (quality) => {
    console.log("Changing quality to:", quality)
    setCurrentQuality(quality)
  }

  return (
    <div className="video-player-overlay">
      {/* Top Control Bar */}
      <div className={`video-controls ${showControls ? "" : "opacity-0"}`} style={{ opacity: showControls ? 1 : 0 }}>
        <div className="video-controls-content">
          {/* Left Side - Back Button and Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button onClick={onBack} className="back-btn">
              <span className="icon icon-back"></span>
              <span>Quay lại</span>
            </button>
            <div>
              <h1 className="video-title">{movieTitle}</h1>
              <p style={{ color: "#b8b8b8", fontSize: "0.875rem" }}>Chất lượng: {currentQuality}</p>
            </div>
          </div>

          {/* Right Side - Quality Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <select
              value={currentQuality}
              onChange={(e) => handleQualityChange(e.target.value)}
              className="quality-selector"
            >
              {resolutions?.map((res) => (
                <option key={res.quality} value={res.quality}>
                  {res.quality}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="video-container">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="video-loading">
            <div className="spinner" style={{ width: "60px", height: "60px", marginBottom: "1rem" }}></div>
            <p style={{ fontSize: "1.25rem", fontWeight: "500" }}>Đang tải video...</p>
            <p style={{ color: "#b8b8b8" }}>Chất lượng: {currentQuality}</p>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="video-element"
          crossOrigin="anonymous"
          playsInline
          controls={!isLoading && !error}
        />

        {/* Error Overlay */}
        {error && (
          <div className="video-error">
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <p style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "1.5rem" }}>{error}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "#ff6b6b",
                  border: "none",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Thử lại
              </button>
              <button
                onClick={() => handleQualityChange("480p")}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Chuyển về 480p
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
