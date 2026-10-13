import { Routes, Route, Link } from 'react-router-dom'
import UploadPage from './pages/UploadPage'
import VideoListPage from './pages/VideoListPage'
import VideoPlayerPage from './pages/VideoPlayerPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          <Link to="/" className="font-bold">My Video App</Link>
          <Link to="/" className="hover:underline">Upload</Link>
          <Link to="/videos" className="hover:underline">Videos</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/videos" element={<VideoListPage />} />
          <Route path="/videos/:id" element={<VideoPlayerPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
