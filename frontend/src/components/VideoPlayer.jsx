import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

function VideoPlayer({ url }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play();
      });
    }
  }, [url]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Đang Phát</h2>
      <video ref={videoRef} controls className="w-full max-w-3xl mx-auto rounded-lg shadow" />
    </div>
  );
}

export default VideoPlayer;