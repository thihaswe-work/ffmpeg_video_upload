import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import VideoPlayer from '../components/VideoPlayer'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function VideoPlayerPage() {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_URL}/api/videos/`)
      .then(res => {
        const found = res.data.find(v => v.id === id || v.id.startsWith(id))
        setVideo(found)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!video) return <p>Video not found</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Watch Video</h1>
      <div className="bg-black rounded-lg overflow-hidden">
        <VideoPlayer src={video.manifest_url} poster={video.thumbnail_url} />
      </div>
    </div>
  )
}
