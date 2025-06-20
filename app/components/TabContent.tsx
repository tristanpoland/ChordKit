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
  const frontmatterRegex = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/
  const match = content.trim().match(frontmatterRegex)
  
  if (!match) {
    // If no frontmatter found, return original content
    return { metadata: {}, content: content.trim() }
  }
  
  const [, frontmatter, markdownContent] = match
  const metadata: TabMetadata = {}
  
  // Simple YAML parser for basic key-value pairs
  frontmatter.split(/\r?\n/).forEach(line => {
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

// Escape HTML characters
function escapeHtml(text: string): string {
  const escapeMap: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  return text.replace(/[&<>"'/]/g, (char) => escapeMap[char])
}

// Convert markdown to HTML with comprehensive markdown support
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Store code blocks and inline code temporarily to avoid processing markdown inside them
  const codeBlocks: string[] = []
  const inlineCodes: string[] = []
  
  // Use more unique placeholders to avoid conflicts
  const codeBlockPlaceholder = 'ĦĦĦCODEBLOCKĦĦĦ'
  const inlineCodePlaceholder = 'ĦĦĦINLINECODEĦĦĦ'
  
  // Extract and store fenced code blocks (``` or ```)
  html = html.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    const index = codeBlocks.length
    codeBlocks.push(`<pre class="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto my-4"><code class="text-gray-100 text-sm font-mono whitespace-pre">${escapeHtml(code.trim())}</code></pre>`)
    return `${codeBlockPlaceholder}${index}${codeBlockPlaceholder}`
  })
  
  // Extract and store inline code (single backticks)
  html = html.replace(/`([^`\r\n]+)`/g, (match, code) => {
    const index = inlineCodes.length
    inlineCodes.push(`<code class="bg-gray-800 text-gray-100 px-2 py-1 rounded text-sm font-mono">${escapeHtml(code)}</code>`)
    return `${inlineCodePlaceholder}${index}${inlineCodePlaceholder}`
  })

  // Headers (process before other formatting)
  html = html.replace(/^##### (.*$)/gm, '<h5 class="text-base font-semibold text-white mt-4 mb-2">$1</h5>')
  html = html.replace(/^#### (.*$)/gm, '<h4 class="text-lg font-semibold text-white mt-5 mb-3">$1</h4>')
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-8 mb-6">$1</h1>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-gray-700 my-8">')
  html = html.replace(/^\*\*\*$/gm, '<hr class="border-gray-700 my-8">')
  html = html.replace(/^___$/gm, '<hr class="border-gray-700 my-8">')

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4">$1</blockquote>')
  
  // Multi-line blockquotes
  html = html.replace(/^> ([\s\S]*?)(?=\n(?!>)|\n$)/gm, (match, content) => {
    const lines = content.split('\n').map((line: string) => line.replace(/^> ?/, '')).join('<br>')
    return `<blockquote class="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4">${lines}</blockquote>`
  })

  // Unordered lists
  html = html.replace(/^(\s*)[\*\-\+] (.+)$/gm, (match, indent, content) => {
    const level = Math.floor(indent.length / 2)
    const marginClass = level > 0 ? `ml-${level * 4}` : ''
    return `<li class="text-gray-100 mb-1 ${marginClass}">• ${content}</li>`
  })

  // Ordered lists
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, (match, indent, content) => {
    const level = Math.floor(indent.length / 2)
    const marginClass = level > 0 ? `ml-${level * 4}` : ''
    return `<li class="text-gray-100 mb-1 list-decimal ${marginClass}">${content}</li>`
  })

  // Wrap consecutive list items
  html = html.replace(/((?:<li[^>]*list-decimal.*?<\/li>\s*)+)/gs, '<ol class="my-4 ml-6">$1</ol>')
  html = html.replace(/((?:<li[^>]*(?!list-decimal).*?<\/li>\s*)+)/gs, '<ul class="my-4 ml-6">$1</ul>')

  // Tables
  html = html.replace(/\|(.+)\|\r?\n\|[-\s\|:]+\|\r?\n((?:\|.+\|\r?\n?)*)/g, (match, header, rows) => {
    const headerCells = header.split('|').map((cell: string) => 
      `<th class="border border-gray-600 px-4 py-2 bg-gray-800 text-white font-semibold">${cell.trim()}</th>`
    ).join('')
    
    const rowsHtml = rows.trim().split(/\r?\n/).map((row: string) => {
      const cells = row.split('|').map((cell: string) => 
        `<td class="border border-gray-600 px-4 py-2 text-gray-100">${cell.trim()}</td>`
      ).join('')
      return `<tr>${cells}</tr>`
    }).join('')
    
    return `<table class="border-collapse border border-gray-600 my-4 w-full"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`
  })

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline transition-colors">$1</a>')
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4">')

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del class="text-gray-500">$1</del>')

  // Bold text (handle both ** and __)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong class="font-semibold text-white">$1</strong>')

  // Italic text (handle both * and _)
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>')
  html = html.replace(/_(.*?)_/g, '<em class="italic text-gray-200">$1</em>')

  // GUITAR TAB SPECIFIC FEATURES
  
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

  // Restore inline code FIRST (before code blocks to avoid conflicts)
  inlineCodes.forEach((codeHtml, index) => {
    html = html.replace(`${inlineCodePlaceholder}${index}${inlineCodePlaceholder}`, codeHtml)
  })

  // Restore code blocks
  codeBlocks.forEach((codeHtml, index) => {
    html = html.replace(`${codeBlockPlaceholder}${index}${codeBlockPlaceholder}`, codeHtml)
  })

  // Line breaks and paragraphs
  html = html.replace(/\r?\n\r?\n/g, '</p><p class="mb-4 text-gray-100 leading-relaxed">')
  html = html.replace(/\r?\n/g, '<br>')
  
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