import { useState } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

function MovieDetail({ movie, onBack }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlay = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/stream/${movie.movie_id}`);
      setVideoUrl(response.data);
    } catch (err) {
      setError('Không thể tải video. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Quay Lại
      </button>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
        <p className="text-gray-600 mb-2">{movie.description}</p>
        <p className="text-gray-600 mb-2"><strong>Thể loại:</strong> {movie.genre || 'Không có'}</p>
        <p className="text-gray-600 mb-4"><strong>Năm sản xuất:</strong> {movie.release_year || 'Không có'}</p>

        {videoUrl ? (
          <VideoPlayer url={videoUrl} />
        ) : (
          <>
            <button
              onClick={handlePlay}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Đang tải...' : 'Phát Video'}
            </button>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default MovieDetail;