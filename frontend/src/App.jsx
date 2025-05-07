import { useState } from 'react';
import axios from 'axios';
import MovieList from './components/MovieList';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  const handleSelectMovie = async (movieId) => {
    setSelectedMovie(movieId);
    try {
      const response = await axios.get(`/api/stream/${movieId}`);
      setVideoUrl(response.data);
    } catch (error) {
      console.error('Error fetching presigned URL:', error);
      setVideoUrl('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-3xl font-bold text-center">Movie Streaming</h1>
      </header>
      <main>
        <MovieList onSelectMovie={handleSelectMovie} />
        {videoUrl && <VideoPlayer url={videoUrl} />}
      </main>
    </div>
  );
}

export default App;