"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Search, Film, Menu, X, Home, Grid, Star } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const categories = [
    { name: "Phim Hành Động", path: "/category/hanh-dong" },
    { name: "Phim Võ Thuật", path: "/category/vo-thuat" },
    { name: "Phim Tình Cảm", path: "/category/tinh-cam" },
    { name: "Phim Hoạt Hình", path: "/category/hoat-hinh" },
    { name: "Phim Hài Hước", path: "/category/hai-huoc" },
    { name: "Phim Viễn Tưởng", path: "/category/vien-tuong" },
    { name: "Phim Cổ Trang", path: "/category/co-trang" },
    { name: "Phim Phiêu Lưu", path: "/category/phieu-luu" },
    { name: "Phim Tâm Lý", path: "/category/tam-ly" },
    { name: "Phim Khoa Học", path: "/category/khoa-hoc" },
    { name: "Phim Hình Sự", path: "/category/hinh-su" },
    { name: "Phim Ma - Kinh Dị", path: "/category/ma-kinh-di" },
  ]

  const countries = [
    { name: "Phim Trung Quốc", path: "/country/trung-quoc" },
    { name: "Phim Hàn Quốc", path: "/country/han-quoc" },
    { name: "Phim Nhật Bản", path: "/country/nhat-ban" },
    { name: "Phim Âu Mỹ", path: "/country/au-my" },
    { name: "Phim Thái Lan", path: "/country/thai-lan" },
    { name: "Phim Việt Nam", path: "/country/viet-nam" },
  ]

  const years = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016"]

  return (
    <header className="header">
      <div className="container">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">PhimMoi</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>

            <Link
              to="/category/phim-le"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/category/phim-le"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Phim lẻ
            </Link>

            <Link
              to="/category/phim-bo"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === "/category/phim-bo"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              Phim bộ
            </Link>

            {/* Thể loại dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                <Grid className="h-4 w-4" />
                <span>Thể loại</span>
              </button>
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {categories.map((category) => (
                    <Link
                      key={category.path}
                      to={category.path}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Quốc gia dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                Quốc gia
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  {countries.map((country) => (
                    <Link
                      key={country.path}
                      to={country.path}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      {country.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Năm phát hành dropdown */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors">
                Năm
              </button>
              <div className="absolute top-full left-0 mt-1 w-32 bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {years.map((year) => (
                    <Link
                      key={year}
                      to={`/year/${year}`}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                      Phim {year}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/top-phim"
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <Star className="h-4 w-4" />
              <span>Top phim</span>
            </Link>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên phim, diễn viên..."
                className="input w-64 pr-10"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="space-y-2">
              <Link
                to="/"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                <span>Trang chủ</span>
              </Link>

              <Link
                to="/category/phim-le"
                className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Phim lẻ
              </Link>

              <Link
                to="/category/phim-bo"
                className="block px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Phim bộ
              </Link>

              {/* Mobile search */}
              <form onSubmit={handleSearch} className="px-3 py-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phim..."
                    className="input w-full pr-10"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
