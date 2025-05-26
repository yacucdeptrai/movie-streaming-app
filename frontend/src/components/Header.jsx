"use client"

import { useState } from "react"
import { Search, Film, Menu, X } from "lucide-react"

export default function Header({ onSearch, activeCategory, onCategoryChange }) {
  const [searchInput, setSearchInput] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const categories = [
    { id: "all", label: "Tất cả" },
    { id: "phim-le", label: "Phim lẻ" },
    { id: "phim-bo", label: "Phim bộ" },
    { id: "chieu-rap", label: "Phim chiếu rạp" },
  ]

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              So Thanh Tra
            </h1>
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center space-x-2 flex-1 max-w-md mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Tìm
            </button>
          </form>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 pb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`btn ${activeCategory === category.id ? "btn-primary" : "btn-outline"}`}
            >
              {category.label}
            </button>
          ))}
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phim..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    onCategoryChange(category.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`btn ${activeCategory === category.id ? "btn-primary" : "btn-outline"}`}
                >
                  {category.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
