'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Music, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import ChordRenderer from '../../components/ChordRenderer'

interface SongPageClientProps {
  params: {
    slug: string
  }
}

interface Song {
  title: string
  artist: string
  key: string
  genre: string
  difficulty: string
  preview: string
  path: string
  slug: string
}

export default function SongPageClient({ params }: SongPageClientProps) {
  const [song, setSong] = useState<Song | null>(null)
  const [content, setContent] = useState('')
  const [fontSize, setFontSize] = useState(16)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadSong()
  }, [params.slug])

  const loadSong = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Find the song in all indexes
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      const masterResponse = await fetch(`${basePath}/indexes/master.json`)
      const masterIndex = await masterResponse.json()
      
      let foundSong: Song | null = null
      
      // Search through all indexes
      for (const index of masterIndex.indexes) {
        const indexResponse = await fetch(`${basePath}/indexes/${index.file}`)
        const indexData = await indexResponse.json()
        
        foundSong = indexData.songs.find((s: Song) => s.slug === params.slug)
        if (foundSong) break
      }
      
      if (!foundSong) {
        setError('Song not found')
        return
      }
      
      setSong(foundSong)
      
      // Load the actual song content
      const songResponse = await fetch(`${basePath}/songs/${foundSong.path}`)
      if (!songResponse.ok) {
        setError('Failed to load song content')
        return
      }
      
      const songContent = await songResponse.text()
      setContent(songContent)
      
    } catch (err) {
      console.error('Failed to load song:', err)
      setError('Failed to load song')
    } finally {
      setLoading(false)
    }
  }

  const downloadSong = () => {
    if (!song || !content) return
    
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${song.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12))
  const resetFontSize = () => setFontSize(16)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-gray-300">Loading song...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Library</span>
              </button>
              <div className="border-l border-gray-700 pl-4">
                <Music className="w-6 h-6 text-blue-400 inline mr-2" />
                <span className="text-lg font-semibold text-white">ChordKit</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Font Size Controls */}
              <div className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
                <button
                  onClick={decreaseFontSize}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Decrease font size"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetFontSize}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded text-xs transition-colors"
                  title="Reset font size"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={increaseFontSize}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Increase font size"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={downloadSong}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Song Info */}
        {song && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{song.title}</h1>
                <p className="text-xl text-gray-300 mb-4">{song.artist}</p>
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  {song.key && <span><strong className="text-gray-300">Key:</strong> {song.key}</span>}
                  {song.genre && <span><strong className="text-gray-300">Genre:</strong> {song.genre}</span>}
                  {song.difficulty && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      song.difficulty === 'Beginner' ? 'bg-green-900 text-green-300 border-green-700' :
                      song.difficulty === 'Intermediate' ? 'bg-yellow-900 text-yellow-300 border-yellow-700' :
                      'bg-red-900 text-red-300 border-red-700'
                    }`}>
                      {song.difficulty}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Song Content */}
          <ChordRenderer 
            markdown={content} 
            fontSize={fontSize}
            className="max-w-none"
          />
      </div>
    </div>
  )
}