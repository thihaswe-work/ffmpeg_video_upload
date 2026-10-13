import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  const pollStatus = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/videos/${id}`)
        setResult(data)
        if (data.status !== 'processing') clearInterval(pollRef.current)
      } catch (e) {
        clearInterval(pollRef.current)
      }
    }, 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    setProgress(0)
    setResult(null)
    setError(null)
    try {
      const response = await axios.post(`${API_URL}/api/videos/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.round((event.loaded * 100) / event.total))
        }
      })
      setResult(response.data)
      pollStatus(response.data.id)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={uploading || !file}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {uploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm mt-2">{progress}%</p>
        </div>
      )}

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      {result && (
        <div className="mt-6 bg-green-50 p-4 rounded-lg">
          {result.status === 'processing' && (
            <>
              <h2 className="text-lg font-semibold text-green-800">Upload complete — processing…</h2>
              <p className="text-sm text-green-700">Transcoding to HLS. This page will update automatically.</p>
            </>
          )}
          {result.status === 'completed' && (
            <>
              <h2 className="text-lg font-semibold text-green-800">Video ready!</h2>
              <Link to={`/videos/${result.id}`} className="text-sm text-blue-600 underline">
                Watch now
              </Link>
            </>
          )}
          {result.status === 'failed' && (
            <h2 className="text-lg font-semibold text-red-800">Processing failed. Check the backend logs.</h2>
          )}
          <p className="text-xs text-gray-500 mt-2">Video ID: {result.id}</p>
        </div>
      )}
    </div>
  )
}
