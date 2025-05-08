import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ url, onBack }) {
  const videoRef = useRef(null);
  const [playError, setPlayError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    let hls;

    if (!video) return;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((error) => {
          console.error('Error playing video:', error);
          setPlayError('Không thể tự động phát video. Vui lòng nhấn nút Play.');
        });
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);
        if (data.fatal) {
          hls.destroy();
          setPlayError('Lỗi tải video. Vui lòng thử lại sau.');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((error) => {
          console.error('Error playing video:', error);
          setPlayError('Không thể tự động phát video. Vui lòng nhấn nút Play.');
        });
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Nút quay lại */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={onBack}
          className="bg-black bg-opacity-70 text-white px-4 py-2 rounded transition-colors hover:bg-opacity-90"
        >
          Thu nhỏ
        </button>
      </div>

      {/* Video player */}
      <div className="relative w-full max-w-5xl">
        <video
          ref={videoRef}
          controls
          className="w-full h-auto max-h-[90vh] object-contain z-10"
          autoPlay
          muted={false}
        />
        {playError && (
          <div className="absolute bottom-4 left-0 right-0 text-center text-red-500 z-20">{playError}</div>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;