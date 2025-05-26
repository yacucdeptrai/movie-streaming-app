import { Link } from "react-router-dom"
import { Home, Search, Film } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center max-w-md mx-auto">
        <div className="text-9xl font-bold text-gray-600 mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-4">Trang không tồn tại</h1>
        <p className="text-gray-400 mb-8">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>

        <div className="space-y-4">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Về trang chủ</span>
          </Link>

          <Link
            to="/search"
            className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Search className="h-5 w-5" />
            <span>Tìm kiếm phim</span>
          </Link>
        </div>

        <div className="mt-12 text-gray-500">
          <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Hoặc khám phá những bộ phim hay khác</p>
        </div>
      </div>
    </div>
  )
}
