import { useState } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';
import './MovieDetail.css';

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
    <div className="movie-detail-container">
      {/* Video Player hoặc Thumbnail */}
      {videoUrl && isFullScreen ? (
        <VideoPlayer url={videoUrl} onBack={handleExitFullScreen} />
      ) : (
        <>
          <div className="thumbnail-section">
            <img
              src={movie.thumbnail || 'https://via.placeholder.com/1920x1080?text=No+Image'}
              alt={movie.title}
              className="thumbnail-image"
            />
            <button
              onClick={handlePlay}
              disabled={loading}
              className="play-button"
            >
              {loading ? (
                <>
                  <div className="play-button-spinner"></div>
                  <span>Đang tải...</span>
                </>
              ) : (
                'Phát Video'
              )}
            </button>
            {error && <p className="error-message">{error}</p>}
          </div>

          {/* Thông tin phim */}
          <div className="info-section">
            <button
              onClick={onBack}
              className="back-button"
            >
              Quay Lại
            </button>
            <div>
              <h2 className="movie-title">{movie.title}</h2>
              <p className="movie-description">{movie.description}</p>
              <div className="movie-meta">
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