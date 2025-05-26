"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Settings, Wifi, WifiOff, ChevronDown } from "lucide-react"
import Hls from "hls.js"

export default function VideoPlayer({ resolutions, onBack, movieTitle }) {
  const videoRef = useRef(null)
  const [currentQuality, setCurrentQuality] = useState("auto")
  const [availableQualities, setAvailableQualities] = useState([])
  const [hls, setHls] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [bandwidth, setBandwidth] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState("unknown")

  // Bandwidth thresholds for auto quality selection (in bits per second)
  const qualityThresholds = {
    "480p": 1500000, // 1.5 Mbps
    "720p": 3000000, // 3 Mbps
    "1080p": 6000000, // 6 Mbps
  }

  // Detect network speed
  useEffect(() => {
    const detectNetworkSpeed = async () => {
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
            setNetworkSpeed("Unknown")
        }
      }
    }

    detectNetworkSpeed()
  }, [])

  // Auto select quality based on bandwidth
  const getAutoQuality = () => {
    if (bandwidth === 0) return "720p" // Default fallback

    if (bandwidth >= qualityThresholds["1080p"]) return "1080p"
    if (bandwidth >= qualityThresholds["720p"]) return "720p"
    return "480p"
  }

  // Setup available qualities
  useEffect(() => {
    const qualities = [
      {
        value: "auto",
        label: `Auto (${networkSpeed})`,
        icon: bandwidth > 0 ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />,
      },
      ...resolutions.map((res) => ({
        value: res.quality,
        label: res.quality,
        icon: null,
      })),
    ]
    setAvailableQualities(qualities)
  }, [resolutions, networkSpeed, bandwidth])

  useEffect(() => {
    const video = videoRef.current
    if (!video || resolutions.length === 0) return

    const initializePlayer = () => {
      setIsLoading(true)
      setError(null)

      // Clean up previous HLS instance
      if (hls) {
        hls.destroy()
      }

      // Determine which quality to use
      let selectedQuality = currentQuality
      if (currentQuality === "auto") {
        selectedQuality = getAutoQuality()
      }

      const selectedResolution = resolutions.find((res) => res.quality === selectedQuality)
      if (!selectedResolution) {
        // Fallback to first available resolution
        selectedQuality = resolutions[0].quality
        setCurrentQuality(selectedQuality)
        return
      }

      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          // Adaptive bitrate settings
          abrEwmaFastLive: 3.0,
          abrEwmaSlowLive: 9.0,
          abrMaxWithRealBitrate: false,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
        })

        hlsInstance.loadSource(selectedResolution.url)
        hlsInstance.attachMedia(video)

        // Handle quality changes for auto mode
        if (currentQuality === "auto") {
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            // Let HLS.js handle adaptive bitrate
            hlsInstance.currentLevel = -1 // Auto mode
          })

          // Monitor bandwidth changes
          hlsInstance.on(Hls.Events.FRAG_LOADED, (event, data) => {
            const currentBandwidth = hlsInstance.bandwidthEstimate
            setBandwidth(currentBandwidth)
          })
        }

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
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Lỗi mạng. Đang thử kết nối lại...")
                hlsInstance.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Lỗi media. Đang thử khôi phục...")
                hlsInstance.recoverMediaError()
                break
              default:
                setError("Lỗi tải video. Vui lòng thử lại sau.")
                setIsLoading(false)
                break
            }
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

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 9999 }}>
      {/* Header Controls - Always Visible */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-80" style={{ zIndex: 10000 }}>
        <div className="flex items-center justify-between">
          {/* Left Side - Back Button and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </button>
            <h1 className="text-white font-semibold truncate max-w-md">{movieTitle}</h1>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center space-x-4">
            {/* Network Info */}
            <div className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
              {bandwidth > 0 ? formatBandwidth(bandwidth) : networkSpeed}
            </div>

            {/* Quality Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">{getCurrentQualityLabel()}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Settings Dropdown */}
              {showSettings && (
                <div
                  className="absolute right-0 top-full mt-2 bg-black bg-opacity-95 backdrop-blur rounded-lg min-w-64 py-2 border border-gray-600"
                  style={{ zIndex: 10001 }}
                >
                  <div className="px-4 py-2 text-white text-sm font-medium border-b border-gray-600">
                    Chọn chất lượng video
                  </div>

                  {availableQualities.map((quality) => (
                    <button
                      key={quality.value}
                      onClick={() => handleQualityChange(quality.value)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-sm hover:bg-white hover:bg-opacity-10 transition-colors ${
                        currentQuality === quality.value ? "text-blue-400 bg-white bg-opacity-5" : "text-white"
                      }`}
                    >
                      {quality.icon && <span>{quality.icon}</span>}
                      <span className="flex-1 text-left">{quality.label}</span>
                      {currentQuality === quality.value && <span className="text-blue-400 font-bold">✓</span>}
                    </button>
                  ))}

                  {/* Bandwidth Info */}
                  <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-600 mt-2">
                    <div className="mb-1">
                      Tốc độ mạng: <span className="text-white">{networkSpeed}</span>
                    </div>
                    {bandwidth > 0 && (
                      <div>
                        Băng thông hiện tại: <span className="text-white">{formatBandwidth(bandwidth)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center relative">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
            style={{ zIndex: 9998 }}
          >
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Đang tải video...</p>
              <p className="text-sm text-gray-400 mt-2">Chất lượng: {getCurrentQualityLabel()}</p>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          controls
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
          playsInline
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
        />

        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80"
            style={{ zIndex: 9998 }}
          >
            <div className="text-center text-white p-6 bg-gray-900 rounded-lg max-w-md border border-gray-600">
              <p className="text-red-400 mb-4 text-lg">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary mr-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Thử lại
                </button>
                <button
                  onClick={() => handleQualityChange("480p")}
                  className="btn btn-outline px-4 py-2 border border-gray-400 hover:bg-gray-700 rounded"
                >
                  Chuyển về 480p
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close settings */}
      {showSettings && (
        <div className="fixed inset-0" style={{ zIndex: 9999 }} onClick={() => setShowSettings(false)} />
      )}
    </div>
  )
}
