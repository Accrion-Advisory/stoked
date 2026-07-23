/**
 * Generates the STOKED icon set + a transparent-background brand mark from the
 * source logo (public/brand/logo-source.png). Re-run after replacing it.
 *   node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(root, 'public/brand/logo-source.png')

async function main() {
  await mkdir(path.join(root, 'public/icons'), { recursive: true })
  await mkdir(path.join(root, 'public/brand'), { recursive: true })

  // ---- App / PWA / favicon icons (keep the logo's dark square) -------------
  const sizes = [
    ['public/icons/icon-192.png', 192],
    ['public/icons/icon-512.png', 512],
    ['public/icons/apple-touch-icon.png', 180],
    ['src/app/apple-icon.png', 180],
    ['public/icons/favicon-48.png', 48],
    ['public/icons/favicon-32.png', 32],
  ]
  for (const [out, size] of sizes) {
    await sharp(SRC).resize(size, size, { fit: 'cover' }).ensureAlpha().png().toFile(path.join(root, out))
  }

  // ---- favicon.ico (embeds a 48px PNG) -------------------------------------
  const ico48 = await sharp(SRC).resize(48, 48).ensureAlpha().png().toBuffer()
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
  const dir = Buffer.alloc(16)
  dir.writeUInt8(48, 0); dir.writeUInt8(48, 1); dir.writeUInt8(0, 2); dir.writeUInt8(0, 3)
  dir.writeUInt16LE(1, 4); dir.writeUInt16LE(32, 6)
  dir.writeUInt32LE(ico48.length, 8); dir.writeUInt32LE(6 + 16, 12)
  await writeFile(path.join(root, 'src/app/favicon.ico'), Buffer.concat([header, dir, ico48]))

  // ---- Transparent green mark (drop the near-black background) --------------
  // Alpha is derived from the brightest channel: the green S is bright, the
  // background is near-black, so a soft ramp cleanly isolates the mark.
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const LOW = 25, HIGH = 48
  for (let i = 0; i < data.length; i += 4) {
    const maxc = Math.max(data[i], data[i + 1], data[i + 2])
    const a = Math.max(0, Math.min(255, Math.round(((maxc - LOW) / (HIGH - LOW)) * 255)))
    data[i + 3] = a
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(root, 'public/brand/stoked-mark.png'))
  // A trimmed, smaller copy for crisp inline use.
  await sharp(path.join(root, 'public/brand/stoked-mark.png'))
    .trim({ threshold: 10 })
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(root, 'public/brand/stoked-mark-trimmed.png'))

  console.log('Icons + transparent mark generated.')
}

main().catch((e) => { console.error(e); process.exit(1) })
