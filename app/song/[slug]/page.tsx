import SongPageClient from './SongPageClient'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface SongPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  try {
    const masterIndexPath = join(process.cwd(), 'public', 'indexes', 'master.json')
    
    // Check if master index exists
    if (!existsSync(masterIndexPath)) {
      console.warn('Master index not found. Run npm run build-index first.')
      return []
    }
    
    const masterIndex = JSON.parse(readFileSync(masterIndexPath, 'utf8'))
    
    const allSlugs: { slug: string }[] = []
    
    // Read all index files and collect slugs
    for (const index of masterIndex.indexes) {
      const indexPath = join(process.cwd(), 'public', 'indexes', index.file)
      
      if (existsSync(indexPath)) {
        const indexData = JSON.parse(readFileSync(indexPath, 'utf8'))
        
        for (const song of indexData.songs) {
          allSlugs.push({ slug: song.slug })
        }
      }
    }
    
    console.log(`Generated static params for ${allSlugs.length} songs`)
    return allSlugs
    
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default function SongPage({ params }: SongPageProps) {
  return <SongPageClient params={params} />
}