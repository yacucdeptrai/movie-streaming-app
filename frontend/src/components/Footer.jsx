export default function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold text-white mb-4">So Thanh Tra</h3>
            <p className="text-gray-400 text-sm">
              Nền tảng xem phim trực tuyến với chất lượng cao và trải nghiệm tuyệt vời.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Liên kết</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Hỏi đáp
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Chính sách</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách riêng tư
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Bản quyền
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© 2025 So Thanh Tra. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
