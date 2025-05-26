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

  // Initialize with first available resolution if auto fails
  useEffect(() => {
    if (resolutions && resolutions.length > 0) {
      // Try to find 720p, fallback to first available
      const preferred = resolutions.find((r) => r.quality === "720p") || resolutions[0]
      setCurrentQuality(preferred.quality)
    }
  }, [resolutions])

  // Detect network speed
  useEffect(() => {
    const detectNetworkSpeed = async () => {
      try {
        if ("connection" in navigator) {
          const connection = navigator.connection
          const effectiveType = connection.effectiveType
          const downlink = connection.downlink // Mbps

          setBandwidth(downlink * 1000000) // Convert to bps

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

  // Auto select quality based on bandwidth
  const getAutoQuality = () => {
    if (!resolutions || resolutions.length === 0) return "720p"

    if (bandwidth >= 6000000) {
      return resolutions.find((r) => r.quality === "1080p")?.quality || "720p"
    } else if (bandwidth >= 3000000) {
      return resolutions.find((r) => r.quality === "720p")?.quality || "480p"
    } else {
      return resolutions.find((r) => r.quality === "480p")?.quality || resolutions[0]?.quality || "720p"
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !resolutions || resolutions.length === 0) return

    const initializePlayer = () => {
      setIsLoading(true)
      setError(null)

      // Clean up previous HLS instance
      if (hls) {
        hls.destroy()
      }

      // Find the selected resolution
      let selectedQuality = currentQuality
      if (currentQuality === "auto") {
        selectedQuality = getAutoQuality()
      }

      const selectedResolution = resolutions.find((res) => res.quality === selectedQuality)
      if (!selectedResolution) {
        setError(`Không tìm thấy chất lượng ${selectedQuality}`)
        return
      }

      console.log("Loading video:", selectedResolution.quality, selectedResolution.url)

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
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
        // Safari native HLS support
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
      const autoQuality = getAutoQuality()
      return `Auto (${autoQuality})`
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
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 50 }}>
      {/* Top Control Bar - Always Visible */}
      <div
        className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black via-black/80 to-transparent"
        style={{ zIndex: 60 }}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Back Button and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Quay lại</span>
            </button>
            <div className="text-white">
              <h1 className="text-xl font-bold truncate max-w-md">{movieTitle}</h1>
              <p className="text-sm text-gray-300">Đang phát ở chất lượng {getCurrentQualityLabel()}</p>
            </div>
          </div>

          {/* Right Side - Quality Controls */}
          <div className="flex items-center space-x-4">
            {/* Network Info Badge */}
            <div className="bg-blue-600/90 text-white text-sm px-3 py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4" />
                <span>{bandwidth > 0 ? formatBandwidth(bandwidth) : networkSpeed}</span>
              </div>
            </div>

            {/* Quality Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg"
              >
                <Settings className="h-5 w-5" />
                <span>Chất lượng: {getCurrentQualityLabel()}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {/* Quality Dropdown */}
              {showSettings && (
                <div
                  className="absolute right-0 top-full mt-3 bg-gray-900/95 backdrop-blur-lg rounded-xl min-w-80 py-3 shadow-2xl border border-gray-700"
                  style={{ zIndex: 70 }}
                >
                  <div className="px-4 py-3 text-white text-lg font-bold border-b border-gray-700">
                    Chọn chất lượng video
                  </div>

                  <div className="py-2">
                    {availableQualities.map((quality) => (
                      <button
                        key={quality.value}
                        onClick={() => handleQualityChange(quality.value)}
                        className={`w-full flex items-center space-x-4 px-4 py-4 text-left hover:bg-gray-800/50 transition-colors ${
                          currentQuality === quality.value
                            ? "text-red-400 bg-red-900/20 border-l-4 border-red-400"
                            : "text-white"
                        }`}
                      >
                        <span className="text-gray-400">{quality.icon}</span>
                        <span className="flex-1 text-lg">{quality.label}</span>
                        {currentQuality === quality.value && <span className="text-red-400 font-bold text-xl">✓</span>}
                      </button>
                    ))}
                  </div>

                  {/* Network Info Footer */}
                  <div className="px-4 py-3 text-sm text-gray-400 border-t border-gray-700 bg-gray-800/30">
                    <div className="flex justify-between items-center">
                      <span>
                        Tốc độ mạng: <span className="text-white font-medium">{networkSpeed}</span>
                      </span>
                      {bandwidth > 0 && (
                        <span>
                          Băng thông: <span className="text-white font-medium">{formatBandwidth(bandwidth)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 55 }}
          >
            <div className="text-white text-center bg-gray-900/90 p-8 rounded-xl border border-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mx-auto mb-6"></div>
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
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 55 }}
          >
            <div className="text-center text-white p-8 bg-gray-900/95 rounded-xl max-w-md border border-gray-700">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-red-400 mb-6 text-lg font-medium">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => handleQualityChange("480p")}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Chuyển về 480p
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click Outside to Close Dropdown */}
      {showSettings && <div className="fixed inset-0" style={{ zIndex: 65 }} onClick={() => setShowSettings(false)} />}
    </div>
  )
}
