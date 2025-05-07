import { useState, useEffect } from 'react';
import axios from 'axios';
import './MovieList.css';

function MovieList({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(3);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(false);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/search', {
        params: { query: query || undefined, page, limit }
      });
      setMovies(response.data.movies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [query, page]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPage(newPage);
    }
  };

  return (
    <div className="movie-list-container">
      {/* Thanh tìm kiếm */}
      <div className="header">
        <h2 className="header-title">Danh Sách Phim</h2>
        <input
          type="text"
          placeholder="Tìm kiếm phim..."
          value={query}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Danh sách phim */}
      <div className="movie-grid-container">
        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        ) : movies.length === 0 ? (
          <p className="no-movies-message">Không có phim nào để hiển thị.</p>
        ) : (
          <div className="movie-grid">
            {movies.map((movie) => (
              <div
                key={movie.movie_id}
                className="movie-card"
                onClick={() => onSelectMovie(movie)}
              >
                {/* Thumbnail */}
                <div className="thumbnail-container">
                  <img
                    src={movie.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={movie.title}
                    className="thumbnail"
                  />
                </div>
                {/* Thông tin phim */}
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                  <p className="movie-description">{movie.description}</p>
                  <div className="movie-meta">
                    <span>{movie.genre || 'Không có'}</span>
                    <span>{movie.release_year || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phân trang */}
      {!loading && movies.length > 0 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="pagination-button"
            >
              Trước
            </button>
            <span className="pagination-text">
              Trang {pagination.current_page} / {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.total_pages}
              className="pagination-button"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieList;