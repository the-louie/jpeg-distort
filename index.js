const jpeg = require('jpeg-js')
const fs = require('fs')
const http = require('http')

var jpegData = fs.readFileSync('./input/ml.jpg')
var rawImageData = jpeg.decode(jpegData)

let connected = true

const map = (n, start1, stop1, start2, stop2) => ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2

const app = http.createServer((request, response) => {
  console.log('connection')
  request.on('close', function () {
    connected = false
  })

  request.on('end', function () {
    connected = false
  })

  response.writeHead(200, {'Content-Type': 'multipart/x-mixed-replace; boundary=myboundary'})
  sendFrame(request, response, 1)
  // response.end()
})

function sendFrame (request, response, i) {
  let frameData = rawImageData

  // Raw distortions
  // frameData = skew(frameData, 0.1, i)
  frameData = rollX(frameData, 7, i)
  frameData = rollY(frameData, 7, i)
  frameData = bend(frameData, 1, i)

  // JPEG distortions
  let jpegData = jpeg.encode(frameData, 50)
  // jpegData.data = jpegGlitch(jpegData.data)

  // Send header and jpeg data
  const header = `--myboundary\nContent-Type: image/jpg\nContent-length: ${jpegData.data.length}\nJpegQual: 50%\nFPS: 4\n\n`
  response.write(header)
  response.write(jpegData.data)

  if (connected) {
    setTimeout(() => {
      sendFrame(request, response, ++i)
    }, 10)
  } else {
    connected = true
    response.end()
  }
}

app.listen(3000)

// glitch functions

function jpegGlitch (jpegData) {
  const p = Math.floor(Math.random() * jpegData.length + (jpegData.length / 9))
  jpegData[p] = jpegData[p] ^ Math.floor(Math.random() * 3 + 1)
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
      const m = map(i % 100, 0, 100, 0, width * 4)// pixelcount to skew
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
      const mY = map((y + i) % height, 0, height, 0, 3.5)
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
