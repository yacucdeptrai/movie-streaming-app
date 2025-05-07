import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import './VideoPlayer.css';

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
    <div className="video-player-container">
      {/* Nút quay lại */}
      <div className="back-button-container">
        <button
          onClick={onBack}
          className="back-button"
        >
          Thu nhỏ
        </button>
      </div>

      {/* Video player */}
      <div className="video-wrapper">
        <video
          ref={videoRef}
          controls
          className="video-element"
          autoPlay
          muted={false}
        />
        {playError && (
          <div className="error-message">{playError}</div>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;