'use client'

import { useState, useEffect } from 'react'
import { Music, Search, Book, Filter, GitFork } from 'lucide-react'

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

interface SongIndex {
  name: string
  file: string
  count: number
}

interface MasterIndex {
  totalSongs: number
  totalIndexes: number
  indexes: SongIndex[]
  lastUpdated: string
}

function BuildGuard() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <Music className="w-16 h-16 mx-auto mb-6 text-gray-300" />
        <h1 className="text-2xl font-bold text-white mb-4">ChordKit</h1>
        <p className="text-gray-300 mb-6">
          No song indexes found. Please run the build process to generate your song library.
        </p>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-300 font-mono">
            npm run build
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [masterIndex, setMasterIndex] = useState<MasterIndex | null>(null)
  const [currentIndex, setCurrentIndex] = useState<string>('')
  const [songs, setSongs] = useState<Song[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [indexesExist, setIndexesExist] = useState(true)

  useEffect(() => {
    loadMasterIndex()
  }, [])

  const loadMasterIndex = async () => {
    try {
      const response = await fetch('/indexes/master.json')
      
      if (!response.ok) {
        setIndexesExist(false)
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setMasterIndex(data)
      setIndexesExist(true)
      
      // Load first index by default
      if (data.indexes.length > 0) {
        loadSongIndex(data.indexes[0].file)
        setCurrentIndex(data.indexes[0].name)
      }
    } catch (error) {
      console.error('Failed to load master index:', error)
      setIndexesExist(false)
    } finally {
      setLoading(false)
    }
  }

  const loadSongIndex = async (indexFile: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/indexes/${indexFile}`)
      const data = await response.json()
      setSongs(data.songs)
    } catch (error) {
      console.error('Failed to load song index:', error)
      setSongs([])
    } finally {
      setLoading(false)
    }
  }

  const handleIndexChange = (indexName: string, indexFile: string) => {
    setCurrentIndex(indexName)
    loadSongIndex(indexFile)
    setSearchTerm('')
  }

  const filteredSongs = songs.filter(song => {
    const matchesSearch = searchTerm === '' || 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesGenre = selectedGenre === '' || song.genre === selectedGenre
    const matchesDifficulty = selectedDifficulty === '' || song.difficulty === selectedDifficulty
    
    return matchesSearch && matchesGenre && matchesDifficulty
  })

  const uniqueGenres = [...new Set(songs.map(song => song.genre).filter(Boolean))]
  const uniqueDifficulties = [...new Set(songs.map(song => song.difficulty).filter(Boolean))]

  if (loading && !masterIndex) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-gray-300">Loading ChordKit...</p>
        </div>
      </div>
    )
  }

  if (!indexesExist) {
    return <BuildGuard />
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">ChordKit</h1>
              <span className="text-sm text-gray-400">
                {masterIndex?.totalSongs || 0} songs
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/yourusername/chordkit" 
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <GitFork className="w-5 h-5" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
              {/* Alphabet Indexes */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <Book className="w-4 h-4 mr-2" />
                  Browse by Letter
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {masterIndex?.indexes.map((index) => (
                    <button
                      key={index.name}
                      onClick={() => handleIndexChange(index.name, index.file)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentIndex === index.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {index.name}
                      <span className="block text-xs opacity-75">
                        ({index.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Genre
                    </label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Genres</option>
                      {uniqueGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Levels</option>
                      {uniqueDifficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 border border-gray-800 rounded-lg">
              {/* Search Bar */}
              <div className="p-6 border-b border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Song List */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    {currentIndex} ({filteredSongs.length} songs)
                  </h2>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <Music className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
                    <p className="text-gray-300">Loading songs...</p>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-300">No songs found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSongs.map((song) => (
                      <a
                        key={song.slug}
                        href={`/song/${song.slug}`}
                        className="block p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-750 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg">
                              {song.title}
                            </h3>
                            <p className="text-gray-300 mb-2">{song.artist}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              {song.key && <span>Key: {song.key}</span>}
                              {song.genre && <span>Genre: {song.genre}</span>}
                              {song.difficulty && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  song.difficulty === 'Beginner' ? 'bg-green-900 text-green-300 border border-green-700' :
                                  song.difficulty === 'Intermediate' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                                  'bg-red-900 text-red-300 border border-red-700'
                                }`}>
                                  {song.difficulty}
                                </span>
                              )}
                            </div>
                            {song.preview && (
                              <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                {song.preview}
                              </p>
                            )}
                          </div>
                          <Music className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}