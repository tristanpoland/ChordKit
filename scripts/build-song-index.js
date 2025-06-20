const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const SONGS_DIR = path.join(process.cwd(), 'public', 'songs')
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'indexes')
const MAX_ITEMS_PER_INDEX = 1000

// Ensure directories exist
if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true })
}
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function getAllSongFiles(dir) {
  const songs = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item.endsWith('.md')) {
        const relativePath = path.relative(SONGS_DIR, fullPath)
        songs.push(relativePath)
      }
    }
  }
  
  traverse(dir)
  return songs
}

function parseSongMetadata(filePath) {
  try {
    const fullPath = path.join(SONGS_DIR, filePath)
    const content = fs.readFileSync(fullPath, 'utf8')
    const { data, content: body } = matter(content)
    
    // Extract title from frontmatter or filename
    const title = data.title || path.basename(filePath, '.md')
    const artist = data.artist || 'Unknown Artist'
    const key = data.key || ''
    const genre = data.genre || ''
    const difficulty = data.difficulty || ''
    
    // Extract first few lines for preview
    const preview = body.split('\n').slice(0, 3).join('\n').substring(0, 200)
    
    // Create a more consistent slug
    const slug = filePath
      .replace(/\.md$/, '')
      .replace(/\//g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    console.log(`Parsed song: "${title}" -> slug: "${slug}" from path: "${filePath}"`)

    return {
      title,
      artist,
      key,
      genre,
      difficulty,
      preview,
      path: filePath,
      slug: slug
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message)
    return null
  }
}

function getAlphabetGroup(title) {
  const firstChar = title.charAt(0).toUpperCase()
  
  // Define alphabet ranges
  const ranges = [
    { name: 'A-C', start: 'A', end: 'C' },
    { name: 'D-F', start: 'D', end: 'F' },
    { name: 'G-I', start: 'G', end: 'I' },
    { name: 'J-L', start: 'J', end: 'L' },
    { name: 'M-O', start: 'M', end: 'O' },
    { name: 'P-R', start: 'P', end: 'R' },
    { name: 'S-U', start: 'S', end: 'U' },
    { name: 'V-Z', start: 'V', end: 'Z' },
    { name: '0-9', start: '0', end: '9' }
  ]
  
  for (const range of ranges) {
    if (firstChar >= range.start && firstChar <= range.end) {
      return range.name
    }
  }
  
  return 'OTHER'
}

function buildIndexes() {
  console.log('Building song indexes...')
  
  // Get all song files
  const songFiles = getAllSongFiles(SONGS_DIR)
  console.log(`Found ${songFiles.length} song files`)
  
  // Parse metadata for all songs
  const songs = songFiles
    .map(parseSongMetadata)
    .filter(song => song !== null)
    .sort((a, b) => a.title.localeCompare(b.title))
  
  console.log(`Successfully parsed ${songs.length} songs`)
  
  // Group songs by alphabet ranges
  const groups = {}
  
  for (const song of songs) {
    const group = getAlphabetGroup(song.title)
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(song)
  }
  
  // Split large groups into sub-indexes
  const finalIndexes = {}
  
  for (const [groupName, groupSongs] of Object.entries(groups)) {
    if (groupSongs.length <= MAX_ITEMS_PER_INDEX) {
      finalIndexes[groupName] = groupSongs
    } else {
      // Split into multiple indexes
      let partIndex = 1
      for (let i = 0; i < groupSongs.length; i += MAX_ITEMS_PER_INDEX) {
        const chunk = groupSongs.slice(i, i + MAX_ITEMS_PER_INDEX)
        finalIndexes[`${groupName}-${partIndex}`] = chunk
        partIndex++
      }
    }
  }
  
  // Write individual index files
  const indexList = []
  
  for (const [indexName, indexSongs] of Object.entries(finalIndexes)) {
    const indexFile = `${indexName.toLowerCase()}.json`
    const indexPath = path.join(OUTPUT_DIR, indexFile)
    
    const indexData = {
      name: indexName,
      count: indexSongs.length,
      songs: indexSongs
    }
    
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2))
    
    indexList.push({
      name: indexName,
      file: indexFile,
      count: indexSongs.length
    })
    
    console.log(`Created index ${indexName} with ${indexSongs.length} songs`)
  }
  
  // Write master index file
  const masterIndex = {
    totalSongs: songs.length,
    totalIndexes: indexList.length,
    indexes: indexList,
    lastUpdated: new Date().toISOString()
  }
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'master.json'),
    JSON.stringify(masterIndex, null, 2)
  )
  
  console.log(`\nIndex build complete!`)
  console.log(`Total songs: ${songs.length}`)
  console.log(`Total indexes: ${indexList.length}`)
  console.log(`Indexes created: ${indexList.map(i => i.name).join(', ')}`)
}

// Run the build
buildIndexes()