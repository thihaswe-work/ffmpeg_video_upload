import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VideoListPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/videos/`)
      .then(res => setVideos(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {videos.map(video => (
          <Link key={video.id} to={`/videos/${video.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition">
            <img src={video.thumbnail_url} alt="thumbnail" className="w-full h-48 object-cover rounded-t-lg" />
            <div className="p-4">
              <p className="font-semibold">Video #{video.id.substring(0, 8)}</p>
              <p className="text-sm text-gray-600">Status: {video.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
