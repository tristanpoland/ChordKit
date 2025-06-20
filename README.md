# ChordKit 🎸

A beautiful, modern guitar chord sheets library built with Next.js. Browse, search, and play your favorite songs with interactive chord diagrams.

![ChordKit Preview](https://img.shields.io/badge/Next.js-14.0.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

- 🎵 **Interactive Chord Diagrams** - Real chord fingering diagrams using a professional chord database
- 📱 **Responsive Design** - Beautiful interface that works on desktop and mobile
- 🔍 **Smart Search & Filtering** - Find songs by title, artist, genre, or difficulty
- 📚 **Organized Library** - Songs organized alphabetically with metadata support
- 🎨 **Modern Dark Theme** - Elegant dark interface optimized for musicians
- ♿ **Accessibility Features** - Adjustable font sizes and keyboard navigation
- 📥 **Download Support** - Download chord sheets as markdown files
- 🚀 **Static Site Generation** - Fast loading with Next.js SSG
- 🎼 **Markdown Support** - Rich text formatting for chord sheets

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tristanpoland/chordkit.git
   cd chordkit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your first chord sheet**
   ```bash
   mkdir -p public/songs/classic
   ```
   
   Create a file `public/songs/classic/wonderwall.md`:
   ```markdown
   ---
   title: "Wonderwall"
   artist: "Oasis"
   key: "G Major"
   genre: "Rock"
   difficulty: "Beginner"
   ---

   # Wonderwall

   ## Verse 1
   [Em7]Today is gonna be the day that they're [G]gonna throw it back to you
   [D]By now you should've somehow real[C]ized what you gotta do
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see your chord library!

## 📁 Project Structure

```
chordkit/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   │   ├── RightSidebar.tsx   # Chord diagrams sidebar
│   │   └── TabContent.tsx     # Main chord sheet viewer
│   ├── song/[slug]/        # Dynamic song pages
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── public/
│   ├── songs/              # Chord sheet markdown files
│   │   ├── classic/        # Example: classic songs
│   │   └── rock/           # Example: rock songs
│   └── indexes/            # Generated song indexes (auto-created)
├── scripts/
│   └── build-song-index.js # Script to build song indexes
├── .github/workflows/      # GitHub Actions for deployment
└── package.json
```

## 📝 Adding Songs

### Song File Format

Create markdown files in `public/songs/` with frontmatter metadata:

```markdown
---
title: "Song Title"
artist: "Artist Name"
key: "C Major"
genre: "Rock"
difficulty: "Intermediate"
album: "Album Name"          # Optional
---

# Song Title

## Verse 1
[C]This is how you write [F]chords in [G]brackets
[Am]Each chord becomes [F]interactive [C]automatically

## Chorus
[F]ChordKit will generate [C]beautiful diagrams
[G]For any chord you [Am]write in [F]brackets [C]

## Bridge
- C: [C|x32010]              # Optional: Manual chord definitions
- F: [F|133211]
- G: [G|320003]
```

### Supported Metadata

- `title` - Song title
- `artist` - Artist/band name
- `key` - Musical key (e.g., "C Major", "Am")
- `genre` - Genre classification
- `difficulty` - Beginner, Intermediate, or Advanced
- `album` - Album name (optional)

### Organizing Songs

Create subdirectories to organize your collection:

```
public/songs/
├── classic/
│   ├── do-re-mi.md
│   └── amazing-grace.md
├── rock/
│   ├── wonderwall.md
│   └── sweet-child-o-mine.md
├── folk/
│   └── blowin-in-the-wind.md
└── country/
    └── friends-in-low-places.md
```

## 🛠️ Development

### Available Scripts

```bash
# Development server with auto-indexing
npm run dev

# Build for production
npm run build

# Build song indexes only
npm run build-index

# Start production server
npm run start

# Lint code
npm run lint
```

### Adding New Chord Types

ChordKit uses the `@tombatossals/chords-db` library for chord diagrams. It supports:

- Major chords: `C`, `D`, `E`, etc.
- Minor chords: `Cm`, `Dm`, `Em`, etc.
- Seventh chords: `C7`, `Dm7`, `Cmaj7`, etc.
- Extended chords: `C9`, `C11`, `C13`, etc.
- Suspended chords: `Csus2`, `Csus4`, etc.
- Diminished/Augmented: `Cdim`, `Caug`, etc.

Simply write chords in `[ChordName]` format and they'll be automatically recognized!

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Fork this repository**

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"

3. **Update configuration**
   Edit `next.config.js` to match your repository name:
   ```javascript
   const nextConfig = {
     basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
     assetPrefix: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '',
   }
   ```

4. **Push to main branch**
   The GitHub Action will automatically build and deploy your site!

### Other Platforms

ChordKit works on any static hosting platform:
- Vercel
- Netlify
- AWS S3
- Cloudflare Pages

## 🎨 Customization

### Styling

ChordKit uses Tailwind CSS for styling. Key customization points:

- Colors: Edit `tailwind.config.js`
- Fonts: Modify the font imports in `app/layout.tsx`
- Chord diagrams: Customize in `app/components/RightSidebar.tsx`

### Adding Features

Common customizations:

1. **Transposition** - Add key change functionality
2. **Print Mode** - Add print-specific styling
3. **Audio Playback** - Integrate with audio libraries
4. **User Favorites** - Add bookmark functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [tombatossals/chords-db](https://github.com/tombatossals/chords-db) - Guitar chord database
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Beautiful icons

## 📞 Support

- 🐛 **Bug reports**: [Open an issue](https://github.com/tristanpoland/chordkit/issues)

---

**Happy strumming! 🎸✨**