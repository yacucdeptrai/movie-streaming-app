import Header from "./Header"
import Footer from "./Footer"

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  )
}
