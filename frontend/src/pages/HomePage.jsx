"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Play, Star, Calendar, TrendingUp, Clock, Film } from "lucide-react"
import axios from "axios"

export default function HomePage() {
  const [featuredMovies, setFeaturedMovies] = useState([])
  const [newMovies, setNewMovies] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true)

        // Fetch different movie categories
        const [featuredRes, newRes, popularRes] = await Promise.all([
          axios.get("/api/content/movies?featured=true&limit=6"),
          axios.get("/api/content/movies?sort=newest&limit=12"),
          axios.get("/api/content/movies?sort=popular&limit=12"),
        ])

        setFeaturedMovies(featuredRes.data.movies || [])
        setNewMovies(newRes.data.movies || [])
        setPopularMovies(popularRes.data.movies || [])
      } catch (err) {
        console.error("Error fetching movies:", err)
        setError("Không thể tải danh sách phim")

        // Mock data for development
        const mockMovies = [
          {
            id: 1,
            title: "Spider-Man: No Way Home",
            poster: "/placeholder.svg?height=400&width=300",
            year: 2021,
            rating: 8.5,
            genre: "Hành động",
            description: "Peter Parker's secret identity is revealed...",
          },
          {
            id: 2,
            title: "The Batman",
            poster: "/placeholder.svg?height=400&width=300",
            year: 2022,
            rating: 8.2,
            genre: "Hành động",
            description: "Batman ventures into Gotham City's underworld...",
          },
          {
            id: 3,
            title: "Top Gun: Maverick",
            poster: "/placeholder.svg?height=400&width=300",
            year: 2022,
            rating: 8.7,
            genre: "Hành động",
            description: "After thirty years, Maverick is still pushing the envelope...",
          },
        ]

        setFeaturedMovies(mockMovies)
        setNewMovies(mockMovies)
        setPopularMovies(mockMovies)
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  const MovieCard = ({ movie }) => (
    <div className="movie-card">
      <Link to={`/movie/${movie.id}`}>
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={movie.poster || "/placeholder.svg"}
            alt={movie.title}
            className="w-full h-auto object-cover aspect-[2/3]"
          />
          <div className="overlay">
            <Play className="play-button h-16 w-16" />
          </div>
          <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
            {movie.rating}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">{movie.title}</h3>
            <p className="text-gray-300 text-xs">
              {movie.year} • {movie.genre}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )

  const FeaturedMovie = ({ movie }) => (
    <div className="relative h-96 md:h-[500px] rounded-lg overflow-hidden">
      <img src={movie.poster || "/placeholder.svg"} alt={movie.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent">
        <div className="absolute bottom-8 left-8 max-w-lg">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{movie.title}</h2>
          <p className="text-gray-300 text-lg mb-6 line-clamp-3">{movie.description}</p>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-white font-semibold">{movie.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300">{movie.year}</span>
            </div>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">{movie.genre}</span>
          </div>
          <div className="flex space-x-4">
            <Link to={`/watch/${movie.id}`} className="btn btn-primary flex items-center space-x-2 px-6 py-3">
              <Play className="h-5 w-5" />
              <span>Xem ngay</span>
            </Link>
            <Link to={`/movie/${movie.id}`} className="btn btn-secondary flex items-center space-x-2 px-6 py-3">
              <span>Chi tiết</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-400">Đang tải...</span>
      </div>
    )
  }

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Xem Phim Online Miễn Phí</h1>
          <p>Hàng nghìn bộ phim HD chất lượng cao, cập nhật mới nhất</p>
          <Link to="/category/phim-le" className="btn btn-primary text-lg px-8 py-4">
            Khám phá ngay
          </Link>
        </div>
      </section>

      <div className="container">
        {/* Featured Movies */}
        {featuredMovies.length > 0 && (
          <section className="section">
            <h2 className="section-title flex items-center justify-center space-x-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <span>Phim Nổi Bật</span>
            </h2>
            <div className="space-y-8">
              {featuredMovies.slice(0, 3).map((movie) => (
                <FeaturedMovie key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* New Movies */}
        <section className="section">
          <h2 className="section-title flex items-center justify-center space-x-2">
            <Clock className="h-8 w-8 text-blue-500" />
            <span>Phim Mới Cập Nhật</span>
          </h2>
          <div className="movie-grid">
            {newMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/category/phim-moi" className="btn btn-primary">
              Xem thêm
            </Link>
          </div>
        </section>

        {/* Popular Movies */}
        <section className="section">
          <h2 className="section-title flex items-center justify-center space-x-2">
            <TrendingUp className="h-8 w-8 text-red-500" />
            <span>Phim Hot Nhất</span>
          </h2>
          <div className="movie-grid">
            {popularMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/top-phim" className="btn btn-primary">
              Xem thêm
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="section">
          <h2 className="section-title flex items-center justify-center space-x-2">
            <Film className="h-8 w-8 text-purple-500" />
            <span>Thể Loại Phim</span>
          </h2>
          <div className="category-grid">
            {[
              { name: "Phim Hành Động", path: "/category/hanh-dong", color: "bg-red-600" },
              { name: "Phim Tình Cảm", path: "/category/tinh-cam", color: "bg-pink-600" },
              { name: "Phim Hài Hước", path: "/category/hai-huoc", color: "bg-yellow-600" },
              { name: "Phim Kinh Dị", path: "/category/kinh-di", color: "bg-purple-600" },
              { name: "Phim Viễn Tưởng", path: "/category/vien-tuong", color: "bg-blue-600" },
              { name: "Phim Hoạt Hình", path: "/category/hoat-hinh", color: "bg-green-600" },
            ].map((category) => (
              <Link
                key={category.path}
                to={category.path}
                className={`${category.color} rounded-lg p-6 text-center hover-lift hover-glow`}
              >
                <h3 className="text-xl font-bold text-white">{category.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
