"use client"

import { useState } from "react"
import MovieList from "./components/MovieList"
import MovieDetail from "./components/MovieDetail"
import "./index.css"

function App() {
  const [selectedMovie, setSelectedMovie] = useState(null)

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie)
  }

  const handleBackToList = () => {
    setSelectedMovie(null)
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div className="logo">
                <span className="icon icon-movie"></span> MovieStream
              </div>
              {selectedMovie && (
                <button onClick={handleBackToList} className="back-btn">
                  <span className="icon icon-back"></span>
                  <span>Quay lại</span>
                </button>
              )}
            </div>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <a href="#" style={{ color: "#b8b8b8", textDecoration: "none" }}>
                Trang chủ
              </a>
              <a href="#" style={{ color: "#b8b8b8", textDecoration: "none" }}>
                Phim mới
              </a>
              <a href="#" style={{ color: "#b8b8b8", textDecoration: "none" }}>
                Thể loại
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {selectedMovie ? (
            <MovieDetail movie={selectedMovie} onBack={handleBackToList} />
          ) : (
            <MovieList onSelectMovie={handleSelectMovie} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          marginTop: "4rem",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", padding: "2rem 0", color: "#b8b8b8" }}>
            <p>&copy; 2024 MovieStream. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
