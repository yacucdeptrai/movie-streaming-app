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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/watch/:id" element={<VideoPlayerPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/country/:country" element={<CategoryPage />} />
          <Route path="/year/:year" element={<CategoryPage />} />
          <Route path="/top-phim" element={<CategoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
