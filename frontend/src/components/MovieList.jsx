import { useState } from 'react';

function MovieList({ onSelectMovie }) {
  const [movies] = useState([
    { movie_id: 'test', title: 'Sample Movie', description: 'This is a test movie.' },
  ]); // Dữ liệu giả, sau này lấy từ Search Service

  const handleSelect = (movieId) => {
    onSelectMovie(movieId);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Danh Sách Phim</h2>
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
    </div>
  );
}

export default MovieList;