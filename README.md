# ChordKit 🎸

A beautiful, searchable guitar chord sheets library built with Next.js and deployed on GitHub Pages. ChordKit uses the markdown-it-chords specification to render chord notation beautifully in the browser.

## Features

- 📚 **Organized Library**: Songs are automatically indexed alphabetically (A-C, D-F, etc.)
- 🔍 **Smart Search**: Search by song title, artist, genre, or difficulty
- 🎯 **Advanced Filtering**: Filter by genre and difficulty level
- 🎼 **Chord Diagrams**: Interactive guitar fretboard diagrams
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- ⬇️ **Download Songs**: Export individual songs as markdown files
- 🎨 **Font Size Control**: Adjustable text size for better readability
- 🚀 **GitHub Pages Ready**: Automatic deployment via GitHub Actions

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/tristanpoland/chordkit.git
cd chordkit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Add Your Songs

Create song files in the `public/songs/` directory. Songs should be markdown files with frontmatter:

```markdown
---
title: "Song Title"
artist: "Artist Name"
key: "C Major"
genre: "Rock"
difficulty: "Beginner"
---

# Song Title

## Verse 1
[C]Do, a deer, a female deer\
[Dm]Ray, a drop of golden sun\
[Eb]May, a possi[D#]bility

## Chord Reference
- C Major: [C|(3)32010]
- D minor: [Dm|xx0231]
```

### 4. Build the Song Index

```bash
npm run build-index
```

This scans your `public/songs/` directory and creates searchable indexes in `public/indexes/`.

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your chord library!

## Chord Notation Syntax

ChordKit uses the [markdown-it-chords](https://github.com/studiorack/markdown-it-chords) specification:

### Basic Chords
```markdown
[C] [F] [G] [Am]
```

### Complex Chords
```markdown
[CΔ913] [F6(9)] [E-7b13] [CM7sus2]
```

### Chords with Bass Notes
```markdown
[D/F#] [Am7/C]
```

### Chord Diagrams
```markdown
[C|(3)32010]  # Chord with diagram
[(3)32010]    # Standalone diagram
[G13|x,10,x,12,12,12]  # Complex diagrams
```

### Chord Diagram Notation
- Numbers: Fret positions
- `(3)`: Optional finger placement
- `0`, `O`, `o`: Open string
- `X`, `x`: Muted string
- `,`: Separator for frets above 9
