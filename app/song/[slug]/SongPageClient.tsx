'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Music, Download, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, Menu, X } from 'lucide-react'
import TabContent from '../../components/TabContent'
import RightSidebar from '../../components/RightSidebar'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 28))
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12))
  const resetFontSize = () => setFontSize(16)

  // Loading state
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <Loader2 className="w-full h-full text-blue-400 animate-spin" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto">
              <Music className="w-full h-full text-blue-500/20" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Loading Song</h3>
            <p className="text-gray-400">Preparing your musical experience...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">Oops! Something went wrong</h3>
            <p className="text-gray-400">{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <span className="relative z-10">Back to Library</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>
    )
  }

  // Create enhanced content with song metadata in frontmatter
  const enhancedContent = song ? `---
title: ${song.title}
artist: ${song.artist}
key: ${song.key}
genre: ${song.genre}
difficulty: ${song.difficulty}
---

${content}` : content

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Elegant Header */}
        <header className="relative z-20 bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              
              {/* Left Section */}
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => router.push('/')}
                  className="group flex items-center space-x-3 text-gray-400 hover:text-white transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-700/50 transition-colors duration-300">
                    <ArrowLeft className="w-5 h-5" />
                  </div>
                  <span className="hidden sm:inline font-medium">Back to Library</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      ChordKit
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">Professional Chord Library</p>
                  </div>
                </div>
              </div>
              
              {/* Right Section - Controls */}
              <div className="flex items-center space-x-4">
                
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                  title="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                {/* Font Size Controls */}
                <div className="hidden sm:flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
                  <button
                    onClick={decreaseFontSize}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Decrease font size"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  
                  <div className="px-3 py-1">
                    <span className="text-xs text-gray-400 font-medium">{fontSize}px</span>
                  </div>
                  
                  <button
                    onClick={resetFontSize}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Reset font size"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={increaseFontSize}
                    className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Increase font size"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Download Button */}
                <button
                  onClick={downloadSong}
                  className="group relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Controls Panel - Only visible when menu is open */}
        {mobileMenuOpen && (
          <div className="lg:hidden relative z-10 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 p-4">
            <div className="space-y-4">
              {/* Font Size Controls for Mobile */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Font Size</h3>
                <div className="flex items-center bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
                  <button
                    onClick={decreaseFontSize}
                    className="flex-1 p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Decrease font size"
                  >
                    <ZoomOut className="w-4 h-4 mx-auto" />
                  </button>
                  
                  <div className="px-4 py-1">
                    <span className="text-sm text-gray-400 font-medium">{fontSize}px</span>
                  </div>
                  
                  <button
                    onClick={resetFontSize}
                    className="flex-1 p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Reset font size"
                  >
                    <RotateCcw className="w-4 h-4 mx-auto" />
                  </button>
                  
                  <button
                    onClick={increaseFontSize}
                    className="flex-1 p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                    title="Increase font size"
                  >
                    <ZoomIn className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content Area */}
        <div className="flex-1 min-h-0 relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none z-10"></div>
          
          <TabContent 
            content={enhancedContent}
            fontSize={fontSize}
            className="h-full relative z-0"
          />
        </div>
      </div>

      {/* Right Sidebar - Hidden by default on mobile */}
      <div className={`lg:w-80 xl:w-96 ${mobileMenuOpen ? 'block' : 'hidden lg:block'} order-first lg:order-last`}>
        <RightSidebar 
          content={enhancedContent}
          className="h-full border-r lg:border-r-0 lg:border-l border-gray-800/50 bg-gray-900/95 backdrop-blur-xl"
        />
      </div>
    </div>
  )
}