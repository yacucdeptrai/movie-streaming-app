import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ url }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null); // Reset lỗi khi URL thay đổi

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setError('Không thể phát video: ' + data.details);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
      video.addEventListener('error', () => {
        setError('Không thể phát video: Lỗi tải file HLS.');
      });
    }
  }, [url]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Đang Phát</h2>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <video ref={videoRef} controls className="w-full max-w-3xl mx-auto rounded-lg shadow" />
      )}
    </div>
  );
}

export default VideoPlayer;