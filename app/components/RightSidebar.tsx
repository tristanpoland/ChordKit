'use client'

import { useState, useEffect } from 'react'
import guitar from '@tombatossals/chords-db/lib/guitar.json'
import { Music2, Loader2 } from 'lucide-react'

interface RightSidebarProps {
  content: string
  className?: string
}

interface TabMetadata {
  title?: string
  artist?: string
  key?: string
  genre?: string
  difficulty?: string
  album?: string
  [key: string]: any
}

interface ChordInfo {
  name: string
  svg: string
}

// Parse frontmatter from markdown
function parseFrontmatter(content: string): { metadata: TabMetadata; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  if (!match) {
    return { metadata: {}, content }
  }
  
  const [, frontmatter, markdownContent] = match
  const metadata: TabMetadata = {}
  
  // Simple YAML parser for basic key-value pairs
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
      if (key && value) {
        metadata[key] = value
      }
    }
  })
  
  return { metadata, content: markdownContent }
}

// Convert note to database format dynamically
function normalizeNoteForDatabase(note: string): string {
  const noteOnly = note.toUpperCase()
  
  if (!noteOnly.includes('#') && !noteOnly.includes('B')) {
    return noteOnly
  }
  
  const chromaticMap: { [key: string]: string } = {
    'C#': 'Csharp',
    'DB': 'Csharp',
    'D#': 'Eb',
    'EB': 'Eb',
    'F#': 'Fsharp',
    'GB': 'Fsharp',
    'G#': 'Ab',
    'AB': 'Ab',
    'A#': 'Bb',
    'BB': 'Bb'
  }
  
  return chromaticMap[noteOnly] || noteOnly
}

// Helper function to find chord by key and suffix
function findChord(key: string, suffix: string): any {
  try {
    const guitarKey = normalizeNoteForDatabase(key)
    const keyChords = guitar.chords[guitarKey]
    
    if (!keyChords) return null
    return keyChords.find((chord: any) => chord.suffix === suffix)
  } catch (error) {
    console.warn('Error finding chord:', error)
    return null
  }
}

// Parse chord name into key and suffix
function parseChordName(chordName: string): { key: string; suffix: string } {
  const match = chordName.match(/^([A-G][#b]?)(.*)$/i)
  if (!match) return { key: chordName, suffix: 'major' }
  
  const [, key, suffix] = match
  
  // Enhanced suffix mapping to handle complex chords like A7sus4
  const suffixMap: { [key: string]: string } = {
    '': 'major',
    'm': 'minor',
    'min': 'minor',
    'maj': 'major',
    'maj7': 'maj7',
    'm7': 'm7',
    '7': '7',
    '7sus4': '7sus4',  // Add explicit mapping for A7sus4
    'sus2': 'sus2',
    'sus4': 'sus4',
    'dim': 'dim',
    'aug': 'aug',
    '6': '6',
    '9': '9',
    '11': '11',
    '13': '13',
    'add9': 'add9',
    'dim7': 'dim7',
    'm7b5': 'm7b5',
    'maj9': 'maj9',
    'm9': 'm9',
    '9sus4': '9sus4',
    '6/9': '6/9',
    'mmaj7': 'mmaj7'
  }
  
  const lowerSuffix = suffix.toLowerCase()
  
  return {
    key: key.toUpperCase(),
    suffix: suffixMap[lowerSuffix] || lowerSuffix || 'major'
  }
}

// Check if a string is a valid chord in the database
function isValidChord(chordName: string): boolean {
  try {
    const { key, suffix } = parseChordName(chordName)
    const chordData = findChord(key, suffix)
    return chordData !== null && chordData !== undefined
  } catch (error) {
    return false
  }
}

// Extract all potential chords from markdown and validate against database
function extractChords(markdown: string): string[] {
  const chordSet = new Set<string>()
  
  const potentialChords = markdown.match(/\[([^\]]+)\]/g)
  
  if (potentialChords) {
    potentialChords.forEach(match => {
      const chordName = match.slice(1, -1)
      if (isValidChord(chordName)) {
        chordSet.add(chordName)
      }
    })
  }

  return Array.from(chordSet).sort()
}

// Real chord diagram generation using @tombatossals/chords-db
async function getChordDiagram(chordName: string): Promise<string> {
  try {
    const { key, suffix } = parseChordName(chordName)
    const chordData = findChord(key, suffix)
    
    if (chordData && chordData.positions && chordData.positions.length > 0) {
      return createSVGFromChordData(chordName, chordData.positions[0])
    }
  } catch (error) {
    console.log('Chord library error:', error)
  }
  
  return createFallbackChordDiagram(chordName)
}

// Create enhanced SVG from real chord library data
function createSVGFromChordData(chordName: string, position: any): string {
  const width = 120
  const height = 160
  const stringSpacing = 16
  const fretSpacing = 20
  const startX = 22
  const startY = 40

  let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="bg-${chordName}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
      </linearGradient>
      <filter id="shadow-${chordName}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg-${chordName})" rx="12" stroke="#374151" stroke-width="1" filter="url(#shadow-${chordName})"/>
    <text x="${width/2}" y="22" text-anchor="middle" fill="#f9fafb" font-family="system-ui, sans-serif" font-size="14" font-weight="700">${chordName}</text>`

  // Draw strings (vertical lines) with gradient
  for (let i = 0; i < 6; i++) {
    const x = startX + i * stringSpacing
    svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + 4 * fretSpacing}" stroke="#6b7280" stroke-width="2" opacity="0.8"/>`
  }

  // Draw frets (horizontal lines) with enhanced styling
  for (let i = 0; i <= 4; i++) {
    const y = startY + i * fretSpacing
    const strokeWidth = i === 0 ? 4 : 1.5
    const strokeColor = i === 0 ? '#e5e7eb' : '#6b7280'
    const opacity = i === 0 ? '1' : '0.8'
    svg += `<line x1="${startX}" y1="${y}" x2="${startX + 5 * stringSpacing}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
  }

  // Parse frets string from chord data
  const fretsString = position.frets || ''
  
  for (let i = 0; i < Math.min(6, fretsString.length); i++) {
    const x = startX + i * stringSpacing
    const fret = fretsString[i]
    
    if (fret === 'x' || fret === 'X') {
      // Enhanced muted string (X)
      svg += `<g transform="translate(${x}, ${startY-12})">
                <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
                <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
              </g>`
    } else if (fret === '0') {
      // Enhanced open string (O)
      svg += `<circle cx="${x}" cy="${startY-9}" r="6" fill="none" stroke="#10b981" stroke-width="3" opacity="0.9"/>`
    } else {
      // Enhanced fretted note
      const fretNum = parseInt(fret, 16)
      if (!isNaN(fretNum) && fretNum > 0 && fretNum <= 15) {
        const y = startY + (Math.min(fretNum, 4) - 0.5) * fretSpacing
        svg += `<circle cx="${x}" cy="${y}" r="8" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
                <text x="${x}" y="${y+2}" text-anchor="middle" fill="white" font-family="system-ui, sans-serif" font-size="11" font-weight="700">${fretNum}</text>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

// Enhanced fallback chord diagram
function createFallbackChordDiagram(chordName: string): string {
  const width = 120
  const height = 160

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="fallback-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#374151;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#fallback-bg)" rx="12" stroke="#4b5563" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="${width/2}" y="45" text-anchor="middle" fill="#f9fafb" font-family="system-ui, sans-serif" font-size="16" font-weight="700">${chordName}</text>
    <text x="${width/2}" y="80" text-anchor="middle" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">Chord not found</text>
    <text x="${width/2}" y="95" text-anchor="middle" fill="#9ca3af" font-family="system-ui, sans-serif" font-size="11">in database</text>
    <circle cx="${width/2}" cy="120" r="3" fill="#6b7280" opacity="0.5"/>
  </svg>`
}

export default function RightSidebar({ content, className = '' }: RightSidebarProps) {
  const [chords, setChords] = useState<ChordInfo[]>([])
  const [loading, setLoading] = useState(true)
  const { metadata, content: markdownContent } = parseFrontmatter(content)

  useEffect(() => {
    async function processChords() {
      setLoading(true)
      const extractedChords = extractChords(markdownContent)
      
      const chordData = await Promise.all(
        extractedChords.map(async (chordName) => {
          const svg = await getChordDiagram(chordName)
          return { name: chordName, svg }
        })
      )
      
      setChords(chordData)
      setLoading(false)
    }

    processChords()
  }, [markdownContent])

  return (
    <div className={`w-full lg:w-80 xl:w-96 bg-black/80 backdrop-blur-xl flex-shrink-0 relative ${className}`}>
      {/* Enhanced gradient overlay to match main theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
      
      {/* Single scroll container for entire sidebar */}
      <div className="h-full overflow-y-auto overflow-x-hidden relative">
        <div className="min-h-full flex flex-col">
          
          {/* Enhanced Metadata Section */}
          {Object.keys(metadata).length > 0 && (
            <div className="flex-shrink-0 p-6 border-b border-gray-800/50 relative">
              <div className="space-y-5">
                {metadata.title && (
                  <div className="hidden lg:block">
                    <h1 className="text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 leading-tight">
                      {metadata.title}
                    </h1>
                  </div>
                )}
                
                <div className="space-y-4">
                  {metadata.artist && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-semibold block mb-2">Artist</span>
                      <div className="relative">
                        <div className="text-white font-bold bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700/50 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
                          {metadata.artist}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  )}
                  
                  {metadata.album && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-semibold block mb-2">Album</span>
                      <div className="relative">
                        <div className="text-white font-bold bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700/50 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg">
                          {metadata.album}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {metadata.key && (
                      <div className="group">
                        <span className="text-gray-400 text-sm font-semibold block mb-2">Key</span>
                        <div className="relative">
                          <div className="text-center py-3 bg-gradient-to-br from-blue-600/20 to-blue-800/30 border border-blue-500/50 rounded-xl backdrop-blur-sm shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                            <span className="text-blue-300 font-bold text-lg">{metadata.key}</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                    )}
                    
                    {metadata.difficulty && (
                      <div className="group">
                        <span className="text-gray-400 text-sm font-semibold block mb-2">Difficulty</span>
                        <div className="relative">
                          <div className={`text-center py-3 rounded-xl border font-bold text-sm backdrop-blur-sm shadow-lg transition-all duration-300 ${
                            metadata.difficulty === 'Beginner' 
                              ? 'bg-gradient-to-br from-green-600/20 to-green-800/30 border-green-500/50 text-green-300 group-hover:shadow-green-500/25' :
                            metadata.difficulty === 'Intermediate' 
                              ? 'bg-gradient-to-br from-yellow-600/20 to-yellow-800/30 border-yellow-500/50 text-yellow-300 group-hover:shadow-yellow-500/25' :
                              'bg-gradient-to-br from-red-600/20 to-red-800/30 border-red-500/50 text-red-300 group-hover:shadow-red-500/25'
                          }`}>
                            {metadata.difficulty}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {metadata.genre && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-semibold block mb-2">Genre</span>
                      <div className="relative">
                        <div className="text-white font-bold bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700/50 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg">
                          {metadata.genre}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional metadata fields */}
                {Object.entries(metadata)
                  .filter(([key]) => !['title', 'artist', 'album', 'key', 'genre', 'difficulty'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="group">
                      <span className="text-gray-400 text-sm font-semibold block mb-2 capitalize">
                        {key.replace(/[_-]/g, ' ')}
                      </span>
                      <div className="relative">
                        <div className="text-white font-bold bg-gray-800/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-700/50 group-hover:border-blue-500/50 transition-all duration-300 shadow-lg">
                          {value}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Enhanced Chords Section */}
          <div className="flex-1 p-6">
            {/* Enhanced Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl backdrop-blur-sm border border-blue-500/30 shadow-lg">
                  <Music2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Chords Used
                  </h3>
                  {chords.length > 0 && (
                    <span className="inline-block mt-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 text-sm px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
                      {chords.length} chord{chords.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced Chords Content */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-blue-500/30">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                    <div className="absolute inset-0 w-16 h-16 mx-auto">
                      <div className="w-full h-full bg-blue-500/10 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-white">Loading Chords</h4>
                    <p className="text-gray-400 text-sm font-medium">Generating chord diagrams...</p>
                  </div>
                </div>
              </div>
            ) : chords.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {chords.map((chord, index) => (
                    <div
                      key={chord.name}
                      className="group relative transform hover:scale-105 transition-all duration-300 hover:z-10"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                        aspectRatio: '3/4'
                      }}
                    >
                      <div 
                        className="w-full h-full rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 border border-gray-700/50 group-hover:border-blue-500/50 flex items-center justify-center chord-container"
                        dangerouslySetInnerHTML={{ __html: chord.svg }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-gray-700/50">
                  <Music2 className="w-10 h-10 text-gray-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-white">No Chords Detected</h4>
                  <p className="text-gray-400 text-sm">Chords should be marked with [ChordName] brackets</p>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-800/50 mt-auto relative">
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-xs">
                {chords.length > 0 && !loading && (
                  <>
                    <span className="text-blue-400 font-bold">{chords.length}</span> chord{chords.length !== 1 ? 's' : ''} detected
                    <span className="mx-2 text-gray-600">•</span>
                  </>
                )}
                Powered by{' '}
                <code className="bg-gray-800/50 text-blue-400 px-2 py-1 rounded-lg text-xs font-mono border border-gray-700/50 backdrop-blur-sm">
                  @tombatossals/chords-db
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .chord-container svg {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  )
}