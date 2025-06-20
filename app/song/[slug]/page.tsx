import SongPageClient from './SongPageClient'

interface SongPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  try {
    // Read the master index to get all available indexes
    const fs = require('fs')
    const path = require('path')
    
    const masterIndexPath = path.join(process.cwd(), 'public', 'indexes', 'master.json')
    
    // Check if master index exists
    if (!fs.existsSync(masterIndexPath)) {
      console.warn('Master index not found. Run npm run build-index first.')
      return []
    }
    
    const masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8'))
    
    const allSlugs = []
    
    // Read all index files and collect slugs
    for (const index of masterIndex.indexes) {
      const indexPath = path.join(process.cwd(), 'public', 'indexes', index.file)
      
      if (fs.existsSync(indexPath)) {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        
        for (const song of indexData.songs) {
          allSlugs.push({ slug: song.slug })
          console.log(`Generated static param: ${song.slug} for song: ${song.title}`)
        }
      }
    }
    
    console.log(`Generated static params for ${allSlugs.length} songs`)
    console.log('All slugs:', allSlugs.map(s => s.slug))
    return allSlugs
    
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default function SongPage({ params }: SongPageProps) {
  return <SongPageClient params={params} />
}