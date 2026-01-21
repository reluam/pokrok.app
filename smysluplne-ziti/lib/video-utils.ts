/**
 * Extract video ID and platform from URL
 */
export function getVideoInfo(url: string): { platform: 'youtube' | 'vimeo' | 'other'; videoId: string; embedUrl: string; thumbnailUrl: string } | null {
  if (!url) return null

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return {
      platform: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return {
      platform: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}`,
      thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`, // Vumbnail service for Vimeo thumbnails
    }
  }

  return null
}

/**
 * Get Open Graph image or screenshot for a URL
 * Uses microlink.io which automatically extracts Open Graph images
 */
export function getUrlImage(url: string): string {
  if (!url) return ''
  
  // Use microlink.io to get Open Graph image
  // This service automatically extracts OG images from URLs
  return `https://api.microlink.io/image?url=${encodeURIComponent(url)}`
}
