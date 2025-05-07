import { useState, useEffect } from 'react';
import axios from 'axios';

function MovieList({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(3); // Giới hạn 3 phim mỗi trang
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });

  const fetchMovies = async () => {
    try {
      const response = await axios.get('/api/search', {
        params: { query: query || undefined, page, limit }
      });
      setMovies(response.data.movies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setMovies([]);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [query, page]);

  const handleSelect = (movieId) => {
    onSelectMovie(movieId);
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(1); // Reset về trang 1 khi tìm kiếm
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh Sách Phim</h2>

      {/* Thanh tìm kiếm */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm phim..."
          value={query}
          onChange={handleSearch}
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Danh sách phim */}
      {movies.length === 0 ? (
        <p className="text-gray-600">Không có phim nào để hiển thị.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {movies.map((movie) => (
            <div
              key={movie.movie_id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer"
              onClick={() => handleSelect(movie.movie_id)}
            >
              <h3 className="text-lg font-semibold">{movie.title}</h3>
              <p className="text-gray-600">{movie.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang */}
      {movies.length > 0 && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {pagination.current_page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.total_pages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export default MovieList;