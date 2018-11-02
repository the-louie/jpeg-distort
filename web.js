/* global Blob, webkitURL */

const jpeg = require('jpeg-js')

const map = (n, start1, stop1, start2, stop2) => ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2
const c = (s) => document.getElementById(s).checked
const v = (s) => document.getElementById(s).value
/**
 * @param {object} jpegData JPEG object { width: int, height: int, data: uint8arr }
 * @param {string} imageid  DOM element id
 * @param {int}    fps      Update speed
 * @param {int}    i        Iterator, default = 0
 */
function drawFrame (jpegData, imageid, fps, i) {
  if (i === undefined) { i = 0 }
  var newJpegData = window.getFrame(jpegData, {speedx: v('speedx'), skew: c('skew'), bend: c('bend'), rollX: c('rollX'), rollY: c('rollY'), jpeg: c('jpeg')}, i)
  var blob = new Blob([newJpegData.data], {type: 'image/jpeg'})
  var url = (URL || webkitURL).createObjectURL(blob)
  document.getElementById(imageid).src = url
  window.drawTimerID = setTimeout(() => drawFrame(jpegData, imageid, fps, ++i), 1000 / fps)
}

function getFrame (jpegData, c, i) {
  let frameData = jpeg.decode(jpegData)

  // Raw distortions
  if (c.skew) frameData = skew(frameData, 0.1 * Math.abs(Number(c.speedx)), i)
  if (c.rollX) frameData = rollX(frameData, 1 * Math.abs(Number(c.speedx)), i)
  if (c.rollY) frameData = rollY(frameData, 1 * Math.abs(Number(c.speedx)), i)
  if (c.bend) frameData = bend(frameData, 1 * Math.abs(Number(c.speedx)), i)

  // JPEG distortions
  let newJpegData = jpeg.encode(frameData, 50)
  if (c.jpeg) newJpegData.data = jpegGlitch(newJpegData.data, c.speedx)

  return newJpegData
}



// glitch functions
function jpegGlitch (jpegData, amount) {
  for (let i = 0; i <= amount; i += 1) {
    const p = Math.floor(Math.random() * jpegData.length + (jpegData.length / 9))
    jpegData[p] = jpegData[p] ^ Math.floor(Math.random() * 3 + 1)
  }
  return jpegData
}

function rollY (rawImageData, speed, i) {
  const offset = (i * 4) * rawImageData.width * speed
  const firstPart = Buffer.from(rawImageData.data.slice(0, offset % rawImageData.data.length))
  const lastPart = Buffer.from(rawImageData.data.slice((offset) % rawImageData.data.length, rawImageData.data.length))

  return {
    width: rawImageData.width,
    height: rawImageData.height,
    data: Buffer.concat([lastPart, firstPart], rawImageData.data.length)
  }
}

function skew (rawImageData, amount, i) {
  const width = rawImageData.width
  const height = rawImageData.height
  const skewY = Math.floor(Math.random() * height)
  let newImageData = Buffer.alloc(rawImageData.data.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const m = (y < skewY ? 0.5 : -0.5) * Math.floor(width * amount) // pixelcount to skew
      const n = (x + y * width) * 4
      const k = ((x + m % width) + y * width) * 4
      newImageData[n + 0] = rawImageData.data[k + 0]
      newImageData[n + 1] = rawImageData.data[k + 1]
      newImageData[n + 2] = rawImageData.data[k + 2]
    }
  }

  return {
    width: rawImageData.width,
    height: rawImageData.height,
    data: newImageData
  }
}

function rollX (rawImageData, amount, i) {
  const width = rawImageData.width
  const height = rawImageData.height
  let newImageData = Buffer.alloc(rawImageData.data.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const m = map((i * amount) % 100, 0, 100, 0, width * 4)// pixelcount to skew
      const n = (x + y * width) * 4
      const k = ((x + m % width) + y * width) * 4
      newImageData[n + 0] = rawImageData.data[k + 0]
      newImageData[n + 1] = rawImageData.data[k + 1]
      newImageData[n + 2] = rawImageData.data[k + 2]
    }
  }

  return {
    width: rawImageData.width,
    height: rawImageData.height,
    data: newImageData
  }
}

function bend (rawImageData, amount, i) {
  const width = rawImageData.width
  const height = rawImageData.height
  let newImageData = Buffer.alloc(rawImageData.data.length)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const mY = map((y + (i * amount)) % height, 0, height, 0, 3.5)
      const m = Math.floor(map(Math.pow(mY, mY), 0, 250, 0, width))
      const n = (x + y * width) * 4
      const k = ((x + (m % width)) + y * width) * 4
      newImageData[n + 0] = rawImageData.data[k + 0]
      newImageData[n + 1] = rawImageData.data[k + 1]
      newImageData[n + 2] = rawImageData.data[k + 2]
    }
  }
  return {
    width: rawImageData.width,
    height: rawImageData.height,
    data: newImageData
  }
}

// Export functions out of bundle
window.getFrame = getFrame
window.drawFrame = drawFrame
window.c = c
window.v = v
