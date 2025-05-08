import { useState } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

function MovieDetail({ movie, onBack }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/stream/${movie.movie_id}`);
      setVideoUrl(response.data);
      setIsFullScreen(true);
    } catch (err) {
      setError('Không thể tải video. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleExitFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <div className="h-full w-full max-w-7xl flex flex-col">
      {/* Video Player hoặc Thumbnail */}
      {videoUrl && isFullScreen ? (
        <VideoPlayer url={videoUrl} onBack={handleExitFullScreen} />
      ) : (
        <>
          <div className="relative w-full h-96 sm:h-[50vh] lg:h-[70vh] bg-gray-700 flex items-center justify-center">
            <img
              src={movie.thumbnail || 'https://via.placeholder.com/1920x1080?text=No+Image'}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handlePlay}
              disabled={loading}
              className={`absolute px-8 py-4 bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2
                ${loading ? 'bg-gray-600' : 'hover:bg-blue-700'}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Đang tải...</span>
                </>
              ) : (
                'Phát Video'
              )}
            </button>
            {error && <p className="absolute bottom-4 text-red-500">{error}</p>}
          </div>

          {/* Thông tin phim */}
          <div className="p-6 bg-gray-800 flex-1 overflow-y-auto">
            <button
              onClick={onBack}
              className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-lg transition-colors hover:bg-gray-600"
            >
              Quay Lại
            </button>
            <div>
              <h2 className="text-3xl font-bold mb-3">{movie.title}</h2>
              <p className="text-gray-400 mb-3">{movie.description}</p>
              <div className="flex space-x-6 text-gray-300">
                <p><strong>Thể loại:</strong> {movie.genre || 'Không có'}</p>
                <p><strong>Năm sản xuất:</strong> {movie.release_year || 'Không có'}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MovieDetail;