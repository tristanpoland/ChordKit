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

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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
    <div className={`w-full lg:w-80 xl:w-96 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-xl flex-shrink-0 ${className}`}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      {/* Single scroll container for entire sidebar */}
      <div className="h-full overflow-y-auto overflow-x-hidden relative">
        <div className="min-h-full flex flex-col">
          
          {/* Metadata Section */}
          {Object.keys(metadata).length > 0 && (
            <div className="flex-shrink-0 p-6 border-b border-gray-700/50">
              <div className="space-y-4">
                {metadata.title && (
                  <div className="hidden lg:block">
                    <h1 className="text-xl xl:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1 leading-tight">
                      {metadata.title}
                    </h1>
                  </div>
                )}
                
                <div className="space-y-3">
                  {metadata.artist && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-medium block mb-1">Artist</span>
                      <div className="text-white font-semibold bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                        {metadata.artist}
                      </div>
                    </div>
                  )}
                  
                  {metadata.album && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-medium block mb-1">Album</span>
                      <div className="text-white font-semibold bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                        {metadata.album}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.key && (
                      <div className="group">
                        <span className="text-gray-400 text-sm font-medium block mb-1">Key</span>
                        <div className="text-center py-2 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-lg">
                          <span className="text-blue-300 font-bold text-lg">{metadata.key}</span>
                        </div>
                      </div>
                    )}
                    
                    {metadata.difficulty && (
                      <div className="group">
                        <span className="text-gray-400 text-sm font-medium block mb-1">Difficulty</span>
                        <div className={`text-center py-2 rounded-lg border font-semibold text-sm ${
                          metadata.difficulty === 'Beginner' 
                            ? 'bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-600/30 text-green-300' :
                          metadata.difficulty === 'Intermediate' 
                            ? 'bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30 text-yellow-300' :
                            'bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-600/30 text-red-300'
                        }`}>
                          {metadata.difficulty}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {metadata.genre && (
                    <div className="group">
                      <span className="text-gray-400 text-sm font-medium block mb-1">Genre</span>
                      <div className="text-white font-semibold bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                        {metadata.genre}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Additional metadata fields */}
                {Object.entries(metadata)
                  .filter(([key]) => !['title', 'artist', 'album', 'key', 'genre', 'difficulty'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="group">
                      <span className="text-gray-400 text-sm font-medium block mb-1 capitalize">
                        {key.replace(/[_-]/g, ' ')}
                      </span>
                      <div className="text-white font-semibold bg-gray-800/30 rounded-lg px-3 py-2 border border-gray-700/50 group-hover:border-gray-600/50 transition-colors duration-200">
                        {value}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Chords Section */}
          <div className="flex-1 p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg">
                  <Music2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Chords Used
                </h3>
                {chords.length > 0 && (
                  <span className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-300 text-sm px-3 py-1 rounded-full font-semibold">
                    {chords.length}
                  </span>
                )}
              </div>
            </div>
            
            {/* Chords Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <div className="absolute inset-0 w-8 h-8 mx-auto">
                      <Music2 className="w-8 h-8 text-blue-500/20" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Loading chord diagrams...</p>
                </div>
              </div>
            ) : chords.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  {chords.map((chord, index) => (
                    <div
                      key={chord.name}
                      className="group hover:scale-105 transition-all duration-300 hover:z-10 relative"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div 
                        className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
                        dangerouslySetInnerHTML={{ __html: chord.svg }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                  <Music2 className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No chords detected in this song</p>
                <p className="text-gray-600 text-xs mt-1">Chords should be marked with [ChordName] brackets</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-700/50 mt-auto">
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-xs">
                {chords.length > 0 && !loading && (
                  <>
                    <span className="text-blue-400 font-semibold">{chords.length}</span> chord{chords.length !== 1 ? 's' : ''} detected
                    <span className="mx-2">•</span>
                  </>
                )}
                Powered by <code className="bg-gray-800/50 text-blue-400 px-2 py-1 rounded text-xs font-mono">@tombatossals/chords-db</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}