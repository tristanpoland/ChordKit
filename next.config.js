/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ChordKit' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ChordKit/' : '',
}

module.exports = nextConfig