const path = require('path')

const fsSync = require('fs')
const fs = require('fs').promises

const fg = require('fast-glob');
const { Image, createCanvas } = require('canvas')
const mkdirp = require('mkdirp')

const targetDir = 'assets/images/generated/'

const files = fg.sync(['assets/image_sprites/**/*_+([0-9])x+([0-9]).png'], { dot: true });

const entries = files.map(s => {
  const newPath = path.relative('assets/image_sprites/', s)
  const newDir = path.dirname(newPath) + '/' + path.basename(newPath, '.png')
  return {
    file: s,
    size: newDir.match(/_\d+x\d+$/)[0].slice(1).split('x').map(s => parseInt(s, 10)),
    dir: newDir.replace(/_\d+x\d+$/, '') + '/'
  }
})

let fileCount = 0

fg.sync(['assets/images/generated/**/*.png'], { dot: true })
  .forEach(file =>  fsSync.unlinkSync(file))

async function process (entry) {
  const file = await fs.readFile(entry.file)

  /**
   * @type {import('canvas').Image}
   */
  const img = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = file
  })

  const spriteWidth = img.naturalWidth
  const spriteHeight = img.naturalHeight

  const canvas = createCanvas(...entry.size, 'png')
  const ctx = canvas.getContext('2d')

  let index = 1
  let padLength = Math.ceil(Math.log10((spriteHeight / entry.size[1]) * (spriteWidth / entry.size[0]))) + 1

  for (let y = 0; y < spriteHeight; y += entry.size[1]) {
    for (let x = 0; x < spriteWidth; x += entry.size[0]) {
      ctx.clearRect(0, 0, ...entry.size)
      ctx.drawImage(
        img,
        x, y, ...entry.size,
        0, 0, ...entry.size
      )

      const targetDirFull = path.resolve(targetDir, entry.dir)
      await mkdirp(targetDirFull)

      const targetFile = path.resolve(targetDirFull, index.toString().padStart(padLength, '0') + '.png')
      const fileStream = fsSync.createWriteStream(targetFile)

      const pngOut = canvas.createPNGStream()

      await new Promise((resolve, reject) => {
        fileStream.on('finish', () =>  {
          resolve()
        })
        pngOut.pipe(fileStream)
      })

      // console.log(`${targetFile} was created.`)
      fileCount++

      index++
    }
  }
}

const start = Date.now()
Promise.all(entries.map(process)).then(res => {
  console.log(fileCount + ' files created in ' + (Date.now() - start) + ' ms')
})
