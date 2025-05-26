"use client"

import { useState } from "react"
import MovieList from "./components/MovieList"
import MovieDetail from "./components/MovieDetail"
import Header from "./components/Header"
import Footer from "./components/Footer"

function App() {
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie)
  }

  const handleBack = () => {
    setSelectedMovie(null)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setActiveCategory("all")
  }

  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header onSearch={handleSearch} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <main className="flex-1">
        {selectedMovie ? (
          <MovieDetail movie={selectedMovie} onBack={handleBack} />
        ) : (
          <div className="container mx-auto px-4 py-8">
            <MovieList onSelectMovie={handleSelectMovie} searchQuery={searchQuery} activeCategory={activeCategory} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
