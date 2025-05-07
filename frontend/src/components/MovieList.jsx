import { useState, useEffect } from 'react';
import axios from 'axios';

function MovieList({ onSelectMovie }) {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get('/api/search');
        setMovies(response.data);
      } catch (error) {
        console.error('Error fetching movies:', error);
        setMovies([]);
      }
    };
    fetchMovies();
  }, []);

  const handleSelect = (movieId) => {
    onSelectMovie(movieId);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh Sách Phim</h2>
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
    </div>
  );
}

export default MovieList;