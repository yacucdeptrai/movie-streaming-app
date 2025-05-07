import { useState } from 'react';
import MovieList from './components/MovieList';
import MovieDetail from './components/MovieDetail';

function App() {
  const [selectedMovie, setSelectedMovie] = useState(null);

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const handleBack = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {selectedMovie ? (
        <MovieDetail movie={selectedMovie} onBack={handleBack} />
      ) : (
        <MovieList onSelectMovie={handleSelectMovie} />
      )}
    </div>
  );
}

export default App;