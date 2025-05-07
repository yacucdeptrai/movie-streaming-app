import { useState, useEffect } from 'react';
import axios from 'axios';

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
    <div className="h-full w-full max-w-7xl flex flex-col">
      {/* Thanh tìm kiếm */}
      <div className="p-4 bg-gray-800 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">Danh Sách Phim</h2>
        <input
          type="text"
          placeholder="Tìm kiếm phim..."
          value={query}
          onChange={handleSearch}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
        />
      </div>

      {/* Danh sách phim */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : movies.length === 0 ? (
          <p className="text-gray-400 text-center h-full flex items-center justify-center">Không có phim nào để hiển thị.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.movie_id}
                className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onSelectMovie(movie)}
              >
                {/* Thumbnail */}
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                  <img
                    src={movie.thumbnail || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Thông tin phim */}
                <div className="p-4">
                  <h3 className="text-xl font-semibold truncate">{movie.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{movie.description}</p>
                  <div className="mt-2 flex justify-between text-gray-500 text-sm">
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
        <div className="p-4 bg-gray-800 shadow-lg">
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-blue-700 transition-colors"
            >
              Trước
            </button>
            <span className="px-4 py-2 text-gray-300">
              Trang {pagination.current_page} / {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.total_pages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-600 hover:bg-blue-700 transition-colors"
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