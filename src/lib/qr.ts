import jsQR from 'jsqr'

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Unsupported file type. Upload a PNG, JPG, WebP, GIF or BMP image.'
  if (file.size > MAX_IMAGE_BYTES) return `This image is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`
  return null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The image could not be read. It may be corrupted.'))
    img.src = src
  })
}

/**
 * Decodes a QR code from an image entirely in the browser (no upload).
 * Returns the decoded text, or null if no QR code was found.
 */
export async function decodeQrFromFile(objectUrl: string): Promise<string | null> {
  const img = await loadImage(objectUrl)
  // Try a few scales: large photos decode better when downsized, tiny codes when upscaled.
  const longest = Math.max(img.naturalWidth, img.naturalHeight)
  const targets = [Math.min(1600, longest), 1000, 640, Math.min(2400, longest * 2)]
  for (const target of Array.from(new Set(targets))) {
    const scale = target / longest
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas is not available in this browser.')
    ctx.imageSmoothingEnabled = scale < 1
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h)
    const code = jsQR(data.data, w, h, { inversionAttempts: 'attemptBoth' })
    if (code?.data) return code.data
  }
  return null
}
