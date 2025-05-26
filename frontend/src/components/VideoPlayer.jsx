"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Settings, Wifi, ChevronDown, Monitor } from "lucide-react"
import Hls from "hls.js"

export default function VideoPlayer({ resolutions, onBack, movieTitle }) {
  const videoRef = useRef(null)
  const [currentQuality, setCurrentQuality] = useState("720p")
  const [hls, setHls] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [bandwidth, setBandwidth] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState("Unknown")

  // Debug: Log resolutions when component mounts
  useEffect(() => {
    console.log("VideoPlayer mounted with resolutions:", resolutions)
  }, [resolutions])

  // Initialize with first available resolution
  useEffect(() => {
    if (resolutions && resolutions.length > 0) {
      console.log("Available resolutions:", resolutions)
      const preferred = resolutions.find((r) => r.quality === "720p") || resolutions[0]
      setCurrentQuality(preferred.quality)
      console.log("Set initial quality to:", preferred.quality)
    }
  }, [resolutions])

  // Detect network speed
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
              setNetworkSpeed("Very Slow")
              break
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

      const selectedResolution = resolutions.find((res) => res.quality === currentQuality)
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
            setError("Lỗi tải video. Vui lòng thử lại sau.")
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
    setShowSettings(false)
  }

  const handleSettingsClick = () => {
    console.log("Settings button clicked, current state:", showSettings)
    setShowSettings(!showSettings)
  }

  const formatBandwidth = (bps) => {
    if (bps >= 1000000) {
      return `${(bps / 1000000).toFixed(1)} Mbps`
    } else if (bps >= 1000) {
      return `${(bps / 1000).toFixed(0)} Kbps`
    }
    return `${bps} bps`
  }

  const getCurrentQualityLabel = () => {
    if (currentQuality === "auto") {
      return "Auto"
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

  console.log("Rendering VideoPlayer with:", {
    resolutions: resolutions?.length,
    currentQuality,
    showSettings,
    availableQualities: availableQualities.length,
  })

  return (
    <div className="video-player-overlay">
      {/* Top Control Bar */}
      <div className="video-controls">
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
                <span>{bandwidth > 0 ? formatBandwidth(bandwidth) : networkSpeed}</span>
              </div>
            </div>

            {/* Quality Settings Button */}
            <div className="relative">
              <button onClick={handleSettingsClick} className="quality-button">
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
                      {bandwidth > 0 && <span>Băng thông: {formatBandwidth(bandwidth)}</span>}
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
          controls
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          playsInline
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        />

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
