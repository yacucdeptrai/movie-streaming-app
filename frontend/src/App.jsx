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
    <div className="h-screen w-screen bg-gray-900 text-white font-sans flex items-center justify-center overflow-hidden">
      {selectedMovie ? (
        <MovieDetail movie={selectedMovie} onBack={handleBack} />
      ) : (
        <MovieList onSelectMovie={handleSelectMovie} />
      )}
    </div>
  );
}

export default App;