'use client'

import { useState, useEffect } from 'react'
import { Music, Search, Book, Filter, GitFork, Loader2, AlertCircle, Sparkles, Play } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-700/50">
            <Music className="w-12 h-12 text-blue-400" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-blue-500/10 rounded-full animate-ping"></div>
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          ChordKit
        </h1>
        <p className="text-gray-300 mb-8 leading-relaxed">
          No song indexes found. Please run the build process to generate your song library.
        </p>
        
        <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-left">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-400 font-medium">Terminal</span>
          </div>
          <p className="text-green-400 font-mono text-sm">
            $ npm run build
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
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      const response = await fetch(`${basePath}/indexes/master.json`)

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
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      const response = await fetch(`${basePath}/indexes/${indexFile}`)
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

  const uniqueGenres = Array.from(new Set(songs.map(song => song.genre).filter(Boolean)))
  const uniqueDifficulties = Array.from(new Set(songs.map(song => song.difficulty).filter(Boolean)))

  if (loading && !masterIndex) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
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
            <h3 className="text-xl font-semibold text-white">Loading ChordKit</h3>
            <p className="text-gray-400">Building your musical library...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!indexesExist) {
    return <BuildGuard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Enhanced Header */}
      <header className="relative bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    ChordKit
                  </h1>
                  <p className="text-sm text-gray-400">Professional Guitar Chords Library</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300 font-medium">
                    {masterIndex?.totalSongs || 0} songs
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-2">
                  <Book className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300 font-medium">
                    {masterIndex?.totalIndexes || 0} collections
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/yourusername/chordkit" 
                className="group flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600/50 transition-all duration-300 rounded-lg px-4 py-2"
              >
                <GitFork className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-6 space-y-8 sticky top-8">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 rounded-xl pointer-events-none"></div>
              
              {/* Alphabet Indexes */}
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg">
                    <Book className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">Browse by Letter</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {masterIndex?.indexes.map((index, i) => (
                    <button
                      key={index.name}
                      onClick={() => handleIndexChange(index.name, index.file)}
                      className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        currentIndex === index.name
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50'
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <span className="text-lg">{index.name}</span>
                        <span className="text-xs opacity-75">
                          {index.count} songs
                        </span>
                      </div>
                      {currentIndex === index.name && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="relative">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg">
                    <Filter className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="font-bold text-white">Filters</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Genre
                    </label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:border-gray-600/50"
                    >
                      <option value="">All Genres</option>
                      {uniqueGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:border-gray-600/50"
                    >
                      <option value="">All Levels</option>
                      {uniqueDifficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedGenre || selectedDifficulty) && (
                  <button
                    onClick={() => {
                      setSelectedGenre('')
                      setSelectedDifficulty('')
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
              
              {/* Enhanced Search Bar */}
              <div className="relative p-6 border-b border-gray-800/50">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder="Search songs, artists, or chords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all duration-300 hover:border-gray-600/50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Song List */}
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-white">
                      {currentIndex}
                    </h2>
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                      {filteredSongs.length} songs
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                        <div className="absolute inset-0 w-10 h-10 mx-auto">
                          <Music className="w-10 h-10 text-blue-500/20" />
                        </div>
                      </div>
                      <p className="text-gray-400 font-medium">Loading your music...</p>
                    </div>
                  </div>
                ) : filteredSongs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No songs found</h3>
                    <p className="text-gray-400">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSongs.map((song, index) => (
                      <a
                        key={song.slug}
                        href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/song/${song.slug}`}
                        className="group relative p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:border-blue-500/50 hover:bg-gray-800/80 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
                                  {song.title}
                                </h3>
                                <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300 line-clamp-1">
                                  {song.artist}
                                </p>
                              </div>
                              <div className="ml-4 p-2 bg-gray-700/50 rounded-lg group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300">
                                <Play className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              {song.key && (
                                <div className="flex items-center space-x-1 bg-blue-500/20 border border-blue-500/30 rounded-lg px-2 py-1">
                                  <span className="text-xs text-blue-300 font-semibold">Key:</span>
                                  <span className="text-xs text-blue-200 font-bold">{song.key}</span>
                                </div>
                              )}
                              {song.genre && (
                                <div className="flex items-center space-x-1 bg-purple-500/20 border border-purple-500/30 rounded-lg px-2 py-1">
                                  <span className="text-xs text-purple-300 font-semibold">{song.genre}</span>
                                </div>
                              )}
                              {song.difficulty && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  song.difficulty === 'Beginner' 
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                  song.difficulty === 'Intermediate' 
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                    'bg-red-500/20 text-red-300 border-red-500/30'
                                }`}>
                                  {song.difficulty}
                                </span>
                              )}
                            </div>
                            
                            {song.preview && (
                              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                                {song.preview}
                              </p>
                            )}
                          </div>
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