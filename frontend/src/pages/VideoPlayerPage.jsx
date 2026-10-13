import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import VideoPlayer from '../components/VideoPlayer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VideoPlayerPage() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let timer
    const fetchVideo = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/videos/${id}`)
        setVideo(data)
        setLoading(false)
        if (data.status === 'processing') {
          timer = setTimeout(fetchVideo, 3000)
        }
      } catch (err) {
        setError(err.response?.status === 404 ? 'Video not found' : 'Failed to load video')
        setLoading(false)
      }
    }
    fetchVideo()
    return () => clearTimeout(timer)
  }, [id])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!video) return <p>Video not found</p>

  if (video.status === 'processing') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Watch Video</h1>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-700">This video is still being processed…</p>
          <p className="text-sm text-gray-500 mt-2">This page refreshes automatically.</p>
        </div>
      </div>
    )
  }

  if (video.status === 'failed' || !video.manifest_url) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Watch Video</h1>
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-700">Processing failed for this video.</p>
          <Link to="/videos" className="text-blue-600 text-sm">Back to videos</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Watch Video</h1>
      <div className="bg-black rounded-lg overflow-hidden">
        <VideoPlayer src={video.manifest_url} poster={video.thumbnail_url} />
      </div>
    </div>
  )
}
