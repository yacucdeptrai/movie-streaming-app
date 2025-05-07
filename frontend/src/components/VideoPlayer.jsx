import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ url }) {
  const videoRef = useRef(null);

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
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data);
        if (data.fatal) {
          hls.destroy();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((error) => {
          console.error('Error playing video:', error);
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
          onClick={() => window.history.back()}
          className="text-white bg-black bg-opacity-70 px-4 py-2 rounded hover:bg-opacity-90 transition"
        >
          ← Quay lại
        </button>
      </div>

      {/* Video player */}
      <video
        ref={videoRef}
        controls
        className="w-full max-w-5xl h-auto max-h-[90vh] object-contain z-10"
        autoPlay
        muted={false}
      />
    </div>
  );
}

export default VideoPlayer;
