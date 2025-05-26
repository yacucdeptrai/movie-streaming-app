"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Settings,
  Wifi,
  ChevronDown,
  Monitor,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
} from "lucide-react"
import Hls from "hls.js"

export default function VideoPlayer({ resolutions, onBack, movieTitle }) {
  const videoRef = useRef(null)
  const [currentQuality, setCurrentQuality] = useState("auto")
  const [hls, setHls] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [bandwidth, setBandwidth] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState("Unknown")
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Auto-hide controls
  useEffect(() => {
    let timeout
    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    const handleMouseMove = () => resetTimeout()
    const handleMouseLeave = () => {
      clearTimeout(timeout)
      setShowControls(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Initialize with auto quality
  useEffect(() => {
    if (resolutions && resolutions.length > 0) {
      console.log("Available resolutions:", resolutions)
      // Auto quality selection based on network
      const autoQuality = getAutoQuality()
      setCurrentQuality(autoQuality)
      console.log("Set initial quality to:", autoQuality)
    }
  }, [resolutions])

  // Detect network speed and auto-select quality
  useEffect(() => {
    const detectNetworkSpeed = () => {
      try {
        if ("connection" in navigator) {
          const connection = navigator.connection
          const effectiveType = connection.effectiveType
          const downlink = connection.downlink

          setBandwidth(downlink * 1000000)

          switch (effectiveType) {
            case "slow-2g":
            case "2g":
              setNetworkSpeed("Slow")
              break
            case "3g":
              setNetworkSpeed("Medium")
              break
            case "4g":
              setNetworkSpeed("Fast")
              break
            default:
              setNetworkSpeed("Good")
          }
        } else {
          setNetworkSpeed("Good")
        }
      } catch (error) {
        console.log("Network detection not supported")
        setNetworkSpeed("Good")
      }
    }

    detectNetworkSpeed()
  }, [])

  const getAutoQuality = () => {
    if (!resolutions || resolutions.length === 0) return "720p"

    // Auto quality based on bandwidth
    if (bandwidth > 5000000) {
      // > 5 Mbps
      return resolutions.find((r) => r.quality === "1080p")?.quality || "720p"
    } else if (bandwidth > 2000000) {
      // > 2 Mbps
      return resolutions.find((r) => r.quality === "720p")?.quality || "480p"
    } else {
      return resolutions.find((r) => r.quality === "480p")?.quality || resolutions[0]?.quality
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !resolutions || resolutions.length === 0) {
      console.log("Video player not ready:", { video: !!video, resolutions })
      return
    }

    const initializePlayer = () => {
      setIsLoading(true)
      setError(null)

      if (hls) {
        hls.destroy()
      }

      let selectedResolution
      if (currentQuality === "auto") {
        const autoQuality = getAutoQuality()
        selectedResolution = resolutions.find((res) => res.quality === autoQuality) || resolutions[0]
      } else {
        selectedResolution = resolutions.find((res) => res.quality === currentQuality)
      }

      if (!selectedResolution) {
        console.error("Resolution not found:", currentQuality, resolutions)
        setError(`Không tìm thấy chất lượng ${currentQuality}`)
        return
      }

      console.log("Loading video:", selectedResolution.quality, selectedResolution.url)

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          autoStartLoad: true,
          startLevel: -1, // Auto level selection
        })

        hlsInstance.loadSource(selectedResolution.url)
        hlsInstance.attachMedia(video)

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false)
          video
            .play()
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
              console.error("Error playing video:", error)
              setError("Không thể tự động phát video. Vui lòng nhấn nút Play.")
            })
        })

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", event, data)
          if (data.fatal) {
            setError("Lỗi tải video. Vui lòng thử lại sau.")
            setIsLoading(false)
          }
        })

        setHls(hlsInstance)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = selectedResolution.url
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false)
          video
            .play()
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
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
  }, [currentQuality, resolutions, bandwidth])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => {
      setVolume(video.volume * 100)
      setIsMuted(video.muted)
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("volumechange", handleVolumeChange)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("volumechange", handleVolumeChange)
    }
  }, [])

  const handleQualityChange = (quality) => {
    console.log("Changing quality to:", quality)
    setCurrentQuality(quality)
    setShowSettings(false)
  }

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleVolumeChange = (newVolume) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume / 100
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (time) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
  }

  const handleSkip = (seconds) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const handleFullscreen = () => {
    const container = document.querySelector(".video-player-overlay")
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getCurrentQualityLabel = () => {
    if (currentQuality === "auto") {
      return `Auto (${getAutoQuality()})`
    }
    return currentQuality
  }

  // Available qualities including auto
  const availableQualities = [
    {
      value: "auto",
      label: `Auto (${networkSpeed})`,
      icon: <Wifi className="h-4 w-4" />,
    },
    ...(resolutions || []).map((res) => ({
      value: res.quality,
      label: res.quality,
      icon: <Monitor className="h-4 w-4" />,
    })),
  ]

  return (
    <div className="video-player-overlay">
      {/* Top Control Bar */}
      <div className={`video-controls transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between">
          {/* Left Side - Back Button and Title */}
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="back-button">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Quay lại</span>
            </button>
            <div className="text-white">
              <h1 className="text-xl font-bold">{movieTitle}</h1>
              <p className="text-sm text-gray-300">Chất lượng: {getCurrentQualityLabel()}</p>
            </div>
          </div>

          {/* Right Side - Quality Controls */}
          <div className="flex items-center space-x-4">
            {/* Network Info */}
            <div className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4" />
                <span>{bandwidth > 0 ? `${(bandwidth / 1000000).toFixed(1)} Mbps` : networkSpeed}</span>
              </div>
            </div>

            {/* Quality Settings Button */}
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="quality-button">
                <Settings className="h-5 w-5" />
                <span>Chất lượng: {getCurrentQualityLabel()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {/* Quality Dropdown */}
              {showSettings && (
                <div className="quality-dropdown">
                  <div className="px-4 py-3 text-white text-lg font-bold border-b border-gray-700">
                    Chọn chất lượng video
                  </div>

                  <div className="py-2">
                    {availableQualities.map((quality) => (
                      <button
                        key={quality.value}
                        onClick={() => handleQualityChange(quality.value)}
                        className={`quality-option ${currentQuality === quality.value ? "active" : ""}`}
                      >
                        <span className="text-gray-400">{quality.icon}</span>
                        <span className="flex-1 text-lg">{quality.label}</span>
                        {currentQuality === quality.value && <span className="text-red-400 font-bold text-xl">✓</span>}
                      </button>
                    ))}
                  </div>

                  {/* Network Info Footer */}
                  <div className="px-4 py-3 text-sm text-gray-400 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span>Tốc độ mạng: {networkSpeed}</span>
                      {bandwidth > 0 && <span>Băng thông: {(bandwidth / 1000000).toFixed(1)} Mbps</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="flex-1 flex items-center justify-center relative h-full">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="text-white text-center bg-gray-900 bg-opacity-90 p-8 rounded-xl">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-500 mx-auto mb-6"></div>
              <p className="text-xl font-medium mb-2">Đang tải video...</p>
              <p className="text-gray-400">Chất lượng: {getCurrentQualityLabel()}</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          playsInline
          onClick={handlePlayPause}
        />

        {/* Bottom Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => handleSeek(Number.parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Play/Pause */}
              <button onClick={handlePlayPause} className="p-2 text-white hover:text-red-400 transition-colors">
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>

              {/* Skip buttons */}
              <button onClick={() => handleSkip(-10)} className="p-2 text-white hover:text-red-400 transition-colors">
                <SkipBack className="h-5 w-5" />
              </button>

              <button onClick={() => handleSkip(10)} className="p-2 text-white hover:text-red-400 transition-colors">
                <SkipForward className="h-5 w-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button onClick={handleMute} className="p-2 text-white hover:text-red-400 transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Fullscreen */}
              <button onClick={handleFullscreen} className="p-2 text-white hover:text-red-400 transition-colors">
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
            <div className="text-center text-white p-8 bg-gray-900 bg-opacity-95 rounded-xl max-w-md">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-red-400 mb-6 text-lg font-medium">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => handleQualityChange("480p")}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Chuyển về 480p
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click Outside to Close Dropdown */}
      {showSettings && <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />}
    </div>
  )
}
