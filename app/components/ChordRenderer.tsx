'use client'

import { useEffect, useRef, useState } from 'react'
import guitar from '@tombatossals/chords-db/lib/guitar.json' // Import the pre-built JSON

interface TabMetadata {
  title?: string
  artist?: string
  key?: string
  genre?: string
  difficulty?: string
  album?: string
  [key: string]: any
}

interface ChordImageRendererProps {
  markdown: string
  fontSize?: number
  className?: string
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
  
  // Handle natural notes (no sharp/flat)
  if (!noteOnly.includes('#') && !noteOnly.includes('B')) {
    return noteOnly
  }
  
  // Define the chromatic mapping for accidentals
  // The database uses specific formats: Csharp, Eb, Fsharp, Ab, Bb
  const chromaticMap: { [key: string]: string } = {
    'C#': 'Csharp',
    'DB': 'Csharp',  // Db = C#
    'D#': 'Eb',      // D# = Eb
    'EB': 'Eb',
    'F#': 'Fsharp',
    'GB': 'Fsharp',  // Gb = F#
    'G#': 'Ab',      // G# = Ab
    'AB': 'Ab',
    'A#': 'Bb',      // A# = Bb
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

    // Find chord by suffix
    return keyChords.find((chord: any) => chord.suffix === suffix)
  } catch (error) {
    console.warn('Error finding chord:', error)
    return null
  }
}

// Parse chord name into key and suffix
function parseChordName(chordName: string): { key: string; suffix: string } {
  // Match pattern: [Key][#/b][suffix]
  const match = chordName.match(/^([A-G][#b]?)(.*)$/i) // Added case insensitive flag
  if (!match) return { key: chordName, suffix: 'major' }
  
  const [, key, suffix] = match
  
  // Map common suffixes to library format
  const suffixMap: { [key: string]: string } = {
    '': 'major',
    'm': 'minor',
    'min': 'minor',
    'maj': 'major',
    'maj7': 'maj7',
    'm7': 'm7',
    '7': '7',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'dim': 'dim',
    'aug': 'aug',
    '6': '6',
    '9': '9',
    '11': '11',
    '13': '13',
    'add9': 'add9'
  }
  
  return {
    key: key.toUpperCase(), // Normalize to uppercase
    suffix: suffixMap[suffix.toLowerCase()] || suffix.toLowerCase() || 'major'
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
  
  // Match anything in brackets
  const potentialChords = markdown.match(/\[([^\]]+)\]/g)
  
  if (potentialChords) {
    potentialChords.forEach(match => {
      const chordName = match.slice(1, -1) // Remove brackets
      // Only add to chord set if it's a valid chord in the database
      if (isValidChord(chordName)) {
        chordSet.add(chordName)
      }
    })
  }

  return Array.from(chordSet).sort()
}

// Convert markdown to HTML with database-validated chord detection
function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-6">$1</h1>')
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  
  // Chord notation - only for chords that exist in the database
  html = html.replace(/\[([^\]]+)\]/g, (match, chordName) => {
    if (isValidChord(chordName)) {
      return `<span class="chord-inline" style="color: #3b82f6; font-weight: 600; background: #1f2937; padding: 2px 6px; border-radius: 4px; margin: 0 2px; font-size: 0.9em;">${chordName}</span>`
    } else {
      // Return the original text if it's not a valid chord
      return match
    }
  })
  
  // Chord reference lines (like "Em7: [Em7|022030]") - keep existing logic for tab notation
  html = html.replace(
    /^- ([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|6|7|9|11|13)*(?:\/[A-G][#b]?)?): \[.*?\|([0-9x]+)\]/gm,
    '<div class="chord-ref-line mb-2"><span class="chord-name text-blue-400 font-semibold">$1</span>: <span class="chord-frets text-gray-300 font-mono">$2</span></div>'
  )
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-4 text-gray-100">')
  html = html.replace(/\n/g, '<br>')
  
  // Wrap in paragraphs
  html = '<p class="mb-4 text-gray-100">' + html + '</p>'
  
  return html
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
  
  // Fallback when chord is not found
  return createFallbackChordDiagram(chordName)
}

// Create SVG from real chord library data
function createSVGFromChordData(chordName: string, position: any): string {
  const width = 120
  const height = 160
  const stringSpacing = 16
  const fretSpacing = 20
  const startX = 25
  const startY = 40

  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1f2937" rx="8" stroke="#374151" stroke-width="1"/>
    <text x="${width/2}" y="20" text-anchor="middle" fill="#f9fafb" font-family="sans-serif" font-size="14" font-weight="600">${chordName}</text>`

  // Draw strings (vertical lines)
  for (let i = 0; i < 6; i++) {
    const x = startX + i * stringSpacing
    svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + 4 * fretSpacing}" stroke="#6b7280" stroke-width="1.5"/>`
  }

  // Draw frets (horizontal lines)  
  for (let i = 0; i <= 4; i++) {
    const y = startY + i * fretSpacing
    const strokeWidth = i === 0 ? 3 : 1
    const strokeColor = i === 0 ? '#e5e7eb' : '#6b7280'
    svg += `<line x1="${startX}" y1="${y}" x2="${startX + 5 * stringSpacing}" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`
  }

  // Parse frets string from chord data
  const fretsString = position.frets || ''
  
  for (let i = 0; i < Math.min(6, fretsString.length); i++) {
    const x = startX + i * stringSpacing
    const fret = fretsString[i]
    
    if (fret === 'x' || fret === 'X') {
      // Muted string (X)
      svg += `<line x1="${x-4}" y1="${startY-12}" x2="${x+4}" y2="${startY-4}" stroke="#ef4444" stroke-width="2"/>
               <line x1="${x+4}" y1="${startY-12}" x2="${x-4}" y2="${startY-4}" stroke="#ef4444" stroke-width="2"/>`
    } else if (fret === '0') {
      // Open string (O)
      svg += `<circle cx="${x}" cy="${startY-8}" r="5" fill="none" stroke="#10b981" stroke-width="2"/>`
    } else {
      // Fretted note
      const fretNum = parseInt(fret, 16) // Handle hex notation (a, b, c, etc.)
      if (!isNaN(fretNum) && fretNum > 0 && fretNum <= 15) {
        const y = startY + (Math.min(fretNum, 4) - 0.5) * fretSpacing
        svg += `<circle cx="${x}" cy="${y}" r="7" fill="#3b82f6" stroke="#3b82f6"/>
                <text x="${x}" y="${y+2}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="10" font-weight="600">${fretNum > 4 ? fretNum : fretNum}</text>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

// Fallback when chord library is not available
function createFallbackChordDiagram(chordName: string): string {
  const width = 120
  const height = 160

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#1f2937" rx="8" stroke="#374151" stroke-width="1"/>
    <text x="${width/2}" y="40" text-anchor="middle" fill="#f9fafb" font-family="sans-serif" font-size="16" font-weight="600">${chordName}</text>
    <text x="${width/2}" y="80" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="10">Chord not found</text>
    <text x="${width/2}" y="95" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="10">in database</text>
  </svg>`
}

export default function ChordImageRenderer({ markdown, fontSize = 16, className = '' }: ChordImageRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [chords, setChords] = useState<ChordInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<TabMetadata>({})
  const [content, setContent] = useState('')

  useEffect(() => {
    // Parse frontmatter and content
    const { metadata: parsedMetadata, content: markdownContent } = parseFrontmatter(markdown)
    setMetadata(parsedMetadata)
    setContent(markdownContent)

    // Extract and process chords
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
  }, [markdown])

  useEffect(() => {
    if (contentRef.current && content) {
      const html = markdownToHtml(content)
      contentRef.current.innerHTML = html
    }
  }, [content])

  return (
    <div className={`bg-gray-900 p-6 rounded-lg ${className}`} style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Metadata Header */}
      {Object.keys(metadata).length > 0 && (
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {metadata.title && (
              <div className="col-span-full">
                <h1 className="text-2xl font-bold text-white mb-2">{metadata.title}</h1>
              </div>
            )}
            {metadata.artist && (
              <div>
                <span className="text-gray-400 text-sm">Artist:</span>
                <div className="text-white font-medium">{metadata.artist}</div>
              </div>
            )}
            {metadata.album && (
              <div>
                <span className="text-gray-400 text-sm">Album:</span>
                <div className="text-white font-medium">{metadata.album}</div>
              </div>
            )}
            {metadata.key && (
              <div>
                <span className="text-gray-400 text-sm">Key:</span>
                <div className="text-white font-medium">{metadata.key}</div>
              </div>
            )}
            {metadata.genre && (
              <div>
                <span className="text-gray-400 text-sm">Genre:</span>
                <div className="text-white font-medium">{metadata.genre}</div>
              </div>
            )}
            {metadata.difficulty && (
              <div>
                <span className="text-gray-400 text-sm">Difficulty:</span>
                <div className="text-white font-medium">{metadata.difficulty}</div>
              </div>
            )}
            {/* Render any additional metadata fields */}
            {Object.entries(metadata)
              .filter(([key]) => !['title', 'artist', 'album', 'key', 'genre', 'difficulty'].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-400 text-sm capitalize">{key.replace(/[_-]/g, ' ')}:</span>
                  <div className="text-white font-medium">{value}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Chord Gallery */}
      {chords.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Chords Used</h3>
          <div className="flex gap-4 overflow-x-auto pb-4" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4b5563 #1f2937'
          }}>
            {loading ? (
              <div className="text-gray-400 flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                Loading chord diagrams...
              </div>
            ) : (
              chords.map((chord) => (
                <div
                  key={chord.name}
                  className="flex-shrink-0 hover:scale-105 transition-transform duration-200"
                  dangerouslySetInnerHTML={{ __html: chord.svg }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Song Content */}
      <div 
        ref={contentRef}
        className="song-content"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: 1.8,
          color: '#f9fafb',
        }}
      />

      {/* Footer info */}
      <div className="mt-8 pt-4 border-t border-gray-700 text-center">
        <p className="text-gray-500 text-sm">
          {chords.length > 0 && !loading && (
            <>Displaying {chords.length} chord{chords.length !== 1 ? 's' : ''} • </>
          )}
          Powered by <code className="bg-gray-800 px-1 rounded text-xs">@tombatossals/chords-db</code>
        </p>
      </div>
    </div>
  )
}