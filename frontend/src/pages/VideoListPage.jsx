import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const statusStyles = {
  completed: 'bg-green-100 text-green-800',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
}

function VideoCard({ video }) {
  const playable = video.status === 'completed'
  const Wrapper = playable ? Link : 'div'
  const wrapperProps = playable ? { to: `/videos/${video.id}` } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`bg-white rounded-lg shadow overflow-hidden transition ${playable ? 'hover:shadow-lg' : 'opacity-90'}`}
    >
      {video.thumbnail_url ? (
        <img src={video.thumbnail_url} alt="thumbnail" className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
          No thumbnail
        </div>
      )}
      <div className="p-4">
        <p className="font-semibold">Video #{video.id.substring(0, 8)}</p>
        <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full ${statusStyles[video.status] || 'bg-gray-100 text-gray-700'}`}>
          {video.status}
        </span>
      </div>
    </Wrapper>
  )
}

export default function VideoListPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () =>
    axios.get(`${API_URL}/api/videos/`)
      .then(res => setVideos(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!videos.some(v => v.status === 'processing')) return
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [videos])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Videos</h1>
        <button onClick={load} className="text-sm bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
          Refresh
        </button>
      </div>
      {videos.length === 0 ? (
        <p className="text-gray-600">No videos yet. Upload one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map(video => <VideoCard key={video.id} video={video} />)}
        </div>
      )}
    </div>
  )
}
