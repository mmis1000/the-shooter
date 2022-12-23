const path = require('path')

const fsSync = require('fs')
const fs = require('fs').promises

const fg = require('fast-glob');
const { Image, createCanvas } = require('canvas')
const ShelfPack = require('@mapbox/shelf-pack');

const basePath = 'assets/images/'
const files = fg.sync(['assets/images/**/*.png'], { dot: true });

const config = require('../assets/images/map.json')
const { promisify } = require('util')
const sizeOf = promisify(require('image-size'))

const targetPath = "assets/images_merged/merged.png"
const targetInfoPath = "assets/images_merged/merged.json"

/**
 * @type {RegExp[]}
 */
const dupeRegexps = config.ignores_dupe.map(s => new RegExp(s))

function ignoresDupe(s) {
  for (const regexp of dupeRegexps) {
    regexp.lastIndex = 0

    if (regexp.test(s)) {
      return true
    }
  }

  return false
}

/**
 * @type {RegExp[]}
 */
const simpleRegexps = config.simple_patterns.map(s => new RegExp(s))

function isSimpleName(s) {
  for (const regexp of simpleRegexps) {
    regexp.lastIndex = 0

    if (regexp.test(s)) {
      return true
    }
  }

  return false
}

const usedNames = new Set()


async function main() {
  const bakedEntries = []
  const dirs = new Map()

  for (const file of files) {
    const dim = await sizeOf(file)
    let filename = path.basename(file, '.png')

    if (isSimpleName(filename)) {
      const segments = file.split('/')
      filename = segments[segments.length - 2] + '/' + filename
    }

    if (usedNames.has(filename) && !ignoresDupe(filename)) {
      throw new Error(filename + ' was used, original path ' + file)
    }

    const dir = path.dirname(path.relative(basePath, file))

    if (!dirs.has(dir)) {
      dirs.set(dir, [])
    }

    dirs.get(dir).push(filename)

    usedNames.add(filename)
    bakedEntries.push({ ...dim, file, id: filename })
  }

  bakedEntries.sort((i, j) => -i.height + j.height)

  const sprite = new ShelfPack(10, 10, { autoResize: true });
  sprite.pack(bakedEntries, { inPlace: true });

  const spriteWidth = sprite.w
  const spriteHeight = sprite.h

  const canvas = createCanvas(spriteWidth, spriteHeight)
  const ctx = canvas.getContext('2d')

  for (const item of bakedEntries) {
    const img = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = item.file
    })

    ctx.drawImage(
      img,
      0, 0, item.width, item.height,
      item.x, item.y, item.width, item.height
    )
  }

  const targetStream = fsSync.createWriteStream(targetPath)
  const sourceStream = canvas.createPNGStream({ compressionLevel: 10 })

  await new Promise(resolve => {
    targetStream.addListener('finish', resolve)
    sourceStream.pipe(targetStream)
  })

  console.log(targetPath + ' written')

  const info = {
    meta: {
      size: {
        w: spriteWidth,
        h: spriteHeight
      }
    },
    frames: bakedEntries.reduce((prev, curr) => {
      prev[curr.id] = {
        frame: {
          x: curr.x,
          y: curr.y,
          w: curr.width,
          h: curr.height
        }
      }
      return prev
    }, {}),
    directories: [...dirs.entries()].reduce((prev, curr) => {
      prev[curr[0]] = curr[1]
      return prev
    }, {})
  }

  await fs.writeFile(targetInfoPath, JSON.stringify(info))

  console.log(targetInfoPath + ' written')
}
const start = Date.now()
main().then(() => {
  console.log('finished in ' + (Date.now() - start) + ' ms')
})
