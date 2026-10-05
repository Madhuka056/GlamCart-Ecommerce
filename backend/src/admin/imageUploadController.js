import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'

const uploadDirectory = fileURLToPath(new URL('../../uploads/', import.meta.url))
const maxImageBytes = 5 * 1024 * 1024

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageBytes, files: 1 },
})

export function receiveImageUpload(req, res, next) {
  imageUpload.single('image')(req, res, (error) => {
    if (!error) return next()

    const tooLarge = error.code === 'LIMIT_FILE_SIZE'
    return res.status(tooLarge ? 413 : 400).json({
      success: false,
      message: tooLarge ? 'Image must be 5 MB or smaller.' : 'Choose one valid image file to upload.',
    })
  })
}

function getImageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return '.jpg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png'
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) return '.gif'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return '.webp'
  return null
}

export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Select an image to upload.' })
  }

  const extension = getImageExtension(req.file.buffer)
  if (!extension) {
    return res.status(400).json({ success: false, message: 'Use a valid JPEG, PNG, GIF or WebP image.' })
  }

  const filename = `${randomUUID()}${extension}`
  await mkdir(uploadDirectory, { recursive: true })
  await writeFile(path.join(uploadDirectory, filename), req.file.buffer, { flag: 'wx' })

  res.status(201).json({ success: true, path: `/uploads/${filename}` })
}
