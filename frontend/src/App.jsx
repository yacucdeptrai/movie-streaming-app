import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import MovieDetailPage from "./pages/MovieDetailPage"
import VideoPlayerPage from "./pages/VideoPlayerPage"
import SearchPage from "./pages/SearchPage"
import CategoryPage from "./pages/CategoryPage"
import NotFoundPage from "./pages/NotFoundPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/movie/:movieId" element={<MovieDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        {/* Video player on separate route without layout */}
        <Route path="/watch/:movieId" element={<VideoPlayerPage />} />
      </Routes>
    </Router>
  )
}

export default App
