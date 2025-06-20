'use client'

import { useEffect, useRef, useState } from 'react'
import guitar from '@tombatossals/chords-db/lib/guitar.json'

interface TabContentProps {
  content: string
  fontSize?: number
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

// Parse frontmatter from markdown
function parseFrontmatter(content: string): { metadata: TabMetadata; content: string } {
  // More robust regex to handle various line endings and spacing
  const frontmatterRegex = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  if (!match) {
    // If no frontmatter found, return original content
    return { metadata: {}, content }
  }
  
  const [, frontmatter, markdownContent] = match
  const metadata: TabMetadata = {}
  
  // Simple YAML parser for basic key-value pairs
  frontmatter.split(/[\r\n]+/).forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')
      if (key && value) {
        metadata[key] = value
      }
    }
  })
  
  // Return the content WITHOUT the frontmatter, trimmed
  return { metadata, content: markdownContent.trim() }
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

// Check if a string is a valid chord in the database - SAME AS SIDEBAR
function isValidChord(chordName: string): boolean {
  try {
    const { key, suffix } = parseChordName(chordName)
    const chordData = findChord(key, suffix)
    return chordData !== null && chordData !== undefined
  } catch (error) {
    return false
  }
}

// Convert markdown to HTML with chord detection
function markdownToHtml(markdown: string): string {
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-6">$1</h1>')
  
  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  
  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>')
  
  // Chord notation - enhanced styling with hover effects, using DATABASE LOOKUP
  html = html.replace(/\[([^\]]+)\]/g, (match, chordName) => {
    if (isValidChord(chordName)) {
      return `<span class="chord-inline inline-block bg-blue-900/50 text-blue-300 font-semibold px-2 py-1 rounded text-sm border border-blue-700/50 hover:bg-blue-800/60 hover:border-blue-600 transition-all duration-200 cursor-pointer mx-1">${chordName}</span>`
    } else {
      // Return the original text if it's not a valid chord in the database
      return match
    }
  })
  
  // Chord reference lines (like "Em7: [Em7|022030]") - validate against database
  html = html.replace(
    /^- ([A-G][#b]?(?:[^:]*)?): \[.*?\|([0-9x]+)\]/gm,
    (match, chordName, frets) => {
      if (isValidChord(chordName.trim())) {
        return `<div class="chord-ref-line mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"><span class="chord-name text-blue-400 font-semibold text-lg">${chordName}</span>: <span class="chord-frets text-gray-300 font-mono text-sm ml-2">${frets}</span></div>`
      } else {
        return match // Return original if not a valid chord
      }
    }
  )
  
  // Verse/Chorus/Bridge labels
  html = html.replace(/^\[([^\]]+)\]/gm, '<div class="section-label text-yellow-400 font-semibold text-sm uppercase tracking-wide mt-6 mb-2 border-l-4 border-yellow-400 pl-3">$1</div>')
  
  // Line breaks - preserve formatting for song structure
  html = html.replace(/\n\n/g, '</p><p class="mb-4 text-gray-100 leading-relaxed">')
  html = html.replace(/\n/g, '<br>')
  
  // Wrap in paragraphs
  html = '<p class="mb-4 text-gray-100 leading-relaxed">' + html + '</p>'
  
  return html
}

export default function TabContent({ content, fontSize = 16, className = '' }: TabContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [metadata, setMetadata] = useState<TabMetadata>({})
  const [markdownContent, setMarkdownContent] = useState('')

  // Parse frontmatter when content changes
  useEffect(() => {
    const { metadata: parsedMetadata, content: parsedContent } = parseFrontmatter(content)
    setMetadata(parsedMetadata)
    setMarkdownContent(parsedContent)
  }, [content])

  useEffect(() => {
    if (contentRef.current && markdownContent) {
      const html = markdownToHtml(markdownContent)
      contentRef.current.innerHTML = html
    }
  }, [markdownContent])

  return (
    <div className={`h-full overflow-auto ${className}`}>
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Mobile title display */}
        {metadata.title && (
          <div className="lg:hidden mb-6 pb-4 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{metadata.title}</h1>
            {metadata.artist && (
              <p className="text-lg text-gray-400">by {metadata.artist}</p>
            )}
            {(metadata.key || metadata.difficulty) && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                {metadata.key && (
                  <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded">
                    Key: <span className="text-white font-medium">{metadata.key}</span>
                  </span>
                )}
                {metadata.difficulty && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    metadata.difficulty === 'Beginner' ? 'bg-green-900 text-green-300' :
                    metadata.difficulty === 'Intermediate' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {metadata.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Song Content */}
        <div 
          ref={contentRef}
          className="song-content prose prose-invert max-w-none"
          style={{ 
            fontSize: `${fontSize}px`,
            lineHeight: 1.7,
            color: '#f9fafb',
          }}
        />

        {/* Footer spacing */}
        <div className="h-16" />
      </div>
    </div>
  )
}