// @ts-check

/** @type {HTMLImageElement | null} */
let textureAtlas = null
let textureAtlasWidth = 0
let textureAtlasHeight = 0
let textureAtlasInfo = /** @type {
  {
    frames: Record<string, { frame: { x: number, y: number, w: number, h: number }}>
  }
} */(/** @type { unknown } */(null))

/**
 * @type { (name: string, size: number) => Uint16Array }
 */
let allocUint16
/**
 * @type { (name: string, size: number) => Float32Array }
 */
let allocFloat32
{
  allocUint16 = (name, size) => {
    const current = buffers.get(name)
    if (current && size * 2 <= current.byteLength) {
      return new Uint16Array(current, 0, size)
    } else {
      const byteLength = 2 ** (Math.ceil(Math.log2(size * 2)) + 1)
      const newBuffer = new ArrayBuffer(byteLength)
      buffers.set(name, newBuffer)
      return new Uint16Array(newBuffer, 0, size)
    }
  }
  allocFloat32 = (name, size) => {
    const current = buffers.get(name)
    if (current && size * 4 <= current.byteLength) {
      return new Float32Array(current, 0, size)
    } else {
      const byteLength = 2 ** (Math.ceil(Math.log2(size * 4)) + 1)
      const newBuffer = new ArrayBuffer(byteLength)
      buffers.set(name, newBuffer)
      return new Float32Array(newBuffer, 0, size)
    }
  }
  /**
   * @type { Map<string, ArrayBuffer> }
   */
  const buffers = new Map()
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns
 */
function loadShader(gl, type, source) {
  const shader = /** @type {WebGLShader} */(gl.createShader(type));

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Fatal error, cannot create shader')
  }

  return shader;
}

/**
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} vsSource
 * @param {string} fsSource
 * @returns
 */
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = /** @type {WebGLProgram} */(gl.createProgram());
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    throw new Error('Fatal error, cannot create program')
  }

  return shaderProgram;
}

/**
 * @typedef {{
  *   font: string,
  *   fillStyle: string,
  *   textBaseline: string,
  *   textAlign: string,
  *   text: string
  * }} TextureRequest
  */
/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   xOrigin: number,
 *   yOrigin: number,
 *   width: number,
 *   height: number,
 * }} StitchedTexturePart
 */
/**
 * @typedef {{
 *   age: 0,
 *   cacheKey: string,
 *   canvas: HTMLCanvasElement,
 *   width: number,
 *   height: number,
 *   positions: {
 *     [key: string]: StitchedTexturePart
 *   }
 * }} StitchedTexture
 */

const MAX_TEXTURE_AGE = 60;
const PADDING = 4;
/**
 * @type { Map<string, StitchedTexture> }
 */
const cachedTextures = new Map()

/**
 * @param { WebGLRenderingContext } gl
 * @param { WebGLTexture } texture
 * @param { string } key
 * @param {{ [key: string]: TextureRequest }} requests
 */
function generateTexture(gl, texture, key, requests) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;

  const requestList = Object.entries(requests)
  requestList.sort((a, b) => a[0] > b[0] ? 1 : -1)

  const cacheKey = JSON.stringify(requestList)

  const cache = cachedTextures.get(key)

  if (cache && cache.cacheKey === cacheKey) {
    cache.age = 0;

    // Assume not change

    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, cache.canvas);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return cache
  }

  // reuse it
  const canvas = cache ? cache.canvas : document.createElement('canvas')

  const ctx = /** @type {CanvasRenderingContext2D} */(canvas.getContext('2d'))

  let height = 0
  let width = 0

  /**
   * @param {TextureRequest} data
   */
  function getKey (data) {
    return [
      data.fillStyle,
      data.font,
      data.text,
      data.textAlign,
      data.textBaseline
    ].join('\u0000')
  }

  /**
   * @type { Map<string, StitchedTexturePart & { ids: string[], info: TextureRequest }> }
   */
  const ress = new Map()

  const dimensions = requestList.map(r => {
    const info = r[1]
    ctx.font = info.font
    // @ts-ignore
    ctx.textBaseline = info.textBaseline
    // @ts-ignore
    ctx.textAlign = info.textAlign

    const key = getKey(info)

    const prev = ress.get(key)
    if (prev) {
      prev.ids.push(r[0])
      return prev
    }

    const size = ctx.measureText(info.text)
    /**
     * @type {StitchedTexturePart & { ids: string[], info: TextureRequest }}
     */
    const res = {
      x: 0,
      y: height,
      xOrigin: 0 - (-size.actualBoundingBoxLeft),
      yOrigin: height + (0 - (-size.actualBoundingBoxAscent)),
      width: size.actualBoundingBoxRight - (-size.actualBoundingBoxLeft),
      height: size.actualBoundingBoxDescent - (-size.actualBoundingBoxAscent),
      ids: [r[0]],
      info
    }

    ress.set(key, res)

    width = Math.max(width, res.width)
    height += size.actualBoundingBoxDescent - (-size.actualBoundingBoxAscent)

    height += PADDING
    return res
  })

  canvas.width = Math.ceil(width)
  canvas.height = Math.ceil(height)

  ctx.clearRect(0, 0, width, height)

  for (const d of dimensions) {
    // @ts-ignore
    ctx.textAlign = d.info.textAlign
    // @ts-ignore
    ctx.textBaseline = d.info.textBaseline
    ctx.font = d.info.font
    ctx.fillStyle = d.info.fillStyle
    ctx.fillText(d.info.text, d.xOrigin, d.yOrigin)
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  for (const [key, item] of cachedTextures) {
    item.age++
    if (item.age > MAX_TEXTURE_AGE) {
      cachedTextures.delete(key)
    }
  }

  /**
   * @type {StitchedTexture}
   */
  const res = {
    age: 0,
    cacheKey,
    canvas,
    width,
    height,
    positions: {}
  }

  for (const d of dimensions) {
    for (const id of d.ids) {
      res.positions[id] = d
    }
  }

  cachedTextures.set(key, res)

  return res
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} xOrigin
 * @param {number} yOrigin
 * @param {number} angle
 */
function rotate(x, y, xOrigin, yOrigin, angle) {
  const xVector = x - xOrigin
  const yVector = y - yOrigin
  const newX = xOrigin + xVector * Math.cos(angle) + yVector * Math.sin(angle)
  const newY = yOrigin - xVector * Math.sin(angle) + yVector * Math.cos(angle)
  return [newX, newY]
}

const TYPE_SQUARE = 1
const TYPE_HOLLOW_SQUARE = 2
const TYPE_CIRCLE = 3
const TYPE_HOLLOW_CIRCLE = 4
const TYPE_IMG = 5

systems.push({
  name: 'render',
  dependsOn: ['regions'],
  /**
   * @param {any} g
   * @returns {Promise<void>}
   */
  async asyncInit(g) {
    const gl = g.gl

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    // load texture
    const texturePromise = new Promise((resolve, reject) => {
      const textureAtlas = document.createElement('img')
      textureAtlas.addEventListener('load', () => resolve(textureAtlas))
      textureAtlas.addEventListener('error', reject)
      textureAtlas.src = 'assets/images_merged/merged.png'
    })

    const textureInfoPromise = fetch('assets/images_merged/merged.json').then(res => res.json())

    const [textureAtlas_, textureAtlasInfo_] = await Promise.all([texturePromise, textureInfoPromise])

    textureAtlas = textureAtlas_
    textureAtlasInfo =textureAtlasInfo_

    textureAtlasWidth = textureAtlasInfo_.meta.size.w
    textureAtlasHeight = textureAtlasInfo_.meta.size.h

    gl.bindTexture(gl.TEXTURE_2D, g.programs.object_image.buffers.tImage);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureAtlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, g.programs.object_image_low.buffers.tImage);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureAtlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.bindTexture(gl.TEXTURE_2D, g.programs.object_image_bg.buffers.tImage);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, textureAtlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  },
  /**
   *
   * @param {any} g
   * @returns
   */
  async init(g) {
    // global resize callback
    g.resizeCb = nuzz

    g.dpi = (window.devicePixelRatio || 1) * msaa

    g.canvas = document.getElementById('canvas')

    /**
     * @type { WebGLRenderingContext }
     */
    const gl = g.gl = g.canvas.getContext("webgl");


    if (gl === null) {
      alert("Time traveller? Webgl is not supported on your ancient browser.");
      return;
    }

    g.windowWidth = Math.max(window.innerWidth, 1)
    g.windowHeight = Math.max(window.innerHeight, 1)

    g.canvas.width = g.windowWidth * g.dpi
    g.canvas.height = g.windowHeight * g.dpi

    gl.getExtension('OES_standard_derivatives');

    gl.viewport(0, 0, g.canvas.width, g.canvas.height)

    // 設定清除色彩為黑色，完全不透明
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 透過清除色來清除色彩緩衝區
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    g.programs = {}

    {
      const current = {}
      g.programs.background = current
      current.program = initShaderProgram(
        gl,
        `
          precision mediump float;

          attribute vec3 aVertexColor;
          attribute vec4 aVertexPosition;

          uniform mat4 uModelViewMatrix;
          uniform mat4 uProjectionMatrix;

          varying vec3 fColor;

          void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            fColor = aVertexColor;
          }
        `,
        `
          precision mediump float;

          varying vec3 fColor;

          void main() {
            gl_FragColor = vec4(fColor, 1.0);
          }
        `
      )

      current.data = {
        aVertexPosition: gl.getAttribLocation(current.program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(current.program, 'aVertexColor'),
        uProjectionMatrix: gl.getUniformLocation(current.program, 'uProjectionMatrix'),
        uModelViewMatrix: gl.getUniformLocation(current.program, 'uModelViewMatrix')
      }

      current.buffers = {
        aVertexPosition: gl.createBuffer(),
        aVertexColor: gl.createBuffer()
      }
    }

    /**
     *
     * @param {string} name
     * @param {string} fragShader
     */
    const addProgram = (name, fragShader) => {
      const current = {}
      g.programs[`object_${name}`] = current
      current.program = initShaderProgram(
        gl,
        `
          precision mediump float;

          attribute vec4 aVertexColor;
          attribute vec4 aVertexPosition;

          // Square, Hollow square, Circle
          attribute float aVertexType;
          // Hollow square
          attribute vec2 aVertexThreshold;
          // Circle
          attribute vec2 aVertexOffset;

          uniform mat4 uModelViewMatrix;
          uniform mat4 uProjectionMatrix;

          varying vec4 fColor;
          varying float fType;
          varying vec2 fThreshold;
          varying vec2 fOffset;

          void main() {
            fColor = aVertexColor;
            fType = aVertexType;
            fThreshold = aVertexThreshold;
            fOffset = aVertexOffset;
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
          }
        `,
        `
          #extension GL_EXT_shader_texture_lod : enable
          #extension GL_OES_standard_derivatives : enable
          precision mediump float;

          varying vec4 fColor;
          varying float fType;
          varying vec2 fThreshold;
          varying vec2 fOffset;

          uniform sampler2D uSampler;

          void main() {
            ${fragShader}
          }
        `
      )

      current.data = {
        aVertexPosition: gl.getAttribLocation(current.program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(current.program, 'aVertexColor'),
        aVertexType: gl.getAttribLocation(current.program, 'aVertexType'),
        aVertexThreshold: gl.getAttribLocation(current.program, 'aVertexThreshold'),
        aVertexOffset: gl.getAttribLocation(current.program, 'aVertexOffset'),
        uProjectionMatrix: gl.getUniformLocation(current.program, 'uProjectionMatrix'),
        uModelViewMatrix: gl.getUniformLocation(current.program, 'uModelViewMatrix'),
        uSampler: gl.getUniformLocation(current.program, 'uSampler'),
      }

      current.buffers = {
        eIndex: gl.createBuffer(),
        aVertexPosition: gl.createBuffer(),
        aVertexColor: gl.createBuffer(),
        aVertexType: gl.createBuffer(),
        aVertexThreshold: gl.createBuffer(),
        aVertexOffset: gl.createBuffer(),
        tImage: gl.createTexture()
      }
    }

    addProgram('square', `
      gl_FragColor = fColor;
    `)

    addProgram('square_hollow', `
      gl_FragColor = abs(fOffset.x) > fThreshold.x || abs(fOffset.y) > fThreshold.y
        ? fColor
        : vec4(0.0, 0.0, 0.0, 0.0);
    `)

    addProgram('circle', `
      gl_FragColor = length(fOffset) < fThreshold.x
        ? fColor
        : vec4(0.0, 0.0, 0.0, 0.0);
    `)

    addProgram('circle_hollow', `
      gl_FragColor = length(fOffset) < fThreshold.x && length(fOffset) > fThreshold.y
        ? fColor
        : vec4(0.0, 0.0, 0.0, 0.0);
    `)

    addProgram('text', `
      gl_FragColor = texture2D(uSampler, fOffset);
    `)

    addProgram('image', `
      vec4 color = texture2D(uSampler, fOffset);
      gl_FragColor = color;
    `)

    addProgram('image_low', `
      vec4 color = texture2D(uSampler, fOffset);
      gl_FragColor = color;
    `)

    addProgram('image_bg', `
      vec4 color = texture2D(uSampler, fOffset);
      gl_FragColor = color;
    `)


    window.addEventListener('resize', () => {
      g.dpi = (window.devicePixelRatio || 1) * msaa

      g.windowWidth = Math.max(window.innerWidth, 1)
      g.windowHeight = Math.max(window.innerHeight, 1)

      g.regions['window'] = {
        top: 0,
        left: 0,
        width: Math.max(window.innerWidth, 1),
        height: Math.max(window.innerHeight, 1),
        scale: 1
      }

      g.canvas.width = g.windowWidth * g.dpi
      g.canvas.height = g.windowHeight * g.dpi

      // resize event
      for (let e of getByComponent('resizeEvent')) {
        e.resizeCb(e, g)
      }

      g.resizeCb(g)
    })
  },
  /**
   * @param {number} s
   * @param {any} g
   */
  tick(s, g) {
    /**
     * @param {any} e
     * @param {any} g
     * @returns
     */
    const correctPosition = (e, g) => {
      if (!e.has_physic) {
        return { x: e.x, y: e.y }
      } else {
        const now = Date.now()
        const prevUpdate = g.prevUpdate
        const diff = (now - prevUpdate) / 1000
        return {
          x: e.x + e.vx * diff,
          y: e.y + e.vy * diff
        }
      }
    }

    // background
    {
      /**
       * @type { WebGLRenderingContext }
       */
      const gl = g.gl
      const current = g.programs.background

      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      gl.clear(gl.COLOR_BUFFER_BIT);

      const projectionMatrix = new Float32Array([
        2 / g.windowWidth, 0, 0, 0,
        0, -2 / g.windowHeight, 0, 0,
        0, 0, 1, -1,
        -1, 1, 0, 0,
      ])

      const modelViewMatrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -1, 1,
      ])

      const positions = new Float32Array([
        0, 0,
        g.windowWidth, 0,
        0, g.windowHeight,
        g.windowWidth, g.windowHeight,
      ])

      {
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers.aVertexPosition);

        gl.bufferData(
          gl.ARRAY_BUFFER,
          positions,
          gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers.aVertexPosition);
        gl.vertexAttribPointer(
          current.data.aVertexPosition,
          numComponents,
          type,
          normalize,
          stride,
          offset
        );

        gl.enableVertexAttribArray(
          current.data.aVertexPosition
        );
      }
      const colors = new Float32Array([
        0, 0, 1 / 3,
        0, 0, 1 / 3,
        0, 0, 0,
        0, 0, 0,
      ])

      {
        const numComponents = 3;  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers.aVertexColor);

        gl.bufferData(
          gl.ARRAY_BUFFER,
          colors,
          gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers.aVertexColor);
        gl.vertexAttribPointer(
          current.data.aVertexColor,
          numComponents,
          type,
          normalize,
          stride,
          offset);
        gl.enableVertexAttribArray(
          current.data.aVertexColor
        );
      }

      gl.useProgram(current.program);

      gl.uniformMatrix4fv(
        current.data.uProjectionMatrix,
        false,
        projectionMatrix
      );

      gl.uniformMatrix4fv(
        current.data.uModelViewMatrix,
        false,
        modelViewMatrix
      );

      {
        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
      }
    }

    let realSize = 0
    getByComponent('draw').forEach((/** @type {{ draw_size: number; }} */ i) => realSize += i.draw_size)
    const totalVertex = realSize * 4;

    /**
     * @type { Record<string, {
         total: number
         aVertexColor: Float32Array
         aVertexPosition: Float32Array
         aVertexType: Float32Array
         aVertexThreshold: Float32Array
         aVertexOffset: Float32Array
       }> }
     */
    const types = {}

    const eIndex = allocUint16('eIndex', totalVertex / 2 * 3)

    for (let i = 0; i < totalVertex / 4; i++) {
      eIndex[i * 6 + 0] = i * 4 + 0
      eIndex[i * 6 + 1] = i * 4 + 1
      eIndex[i * 6 + 2] = i * 4 + 2
      eIndex[i * 6 + 3] = i * 4 + 1
      eIndex[i * 6 + 4] = i * 4 + 2
      eIndex[i * 6 + 5] = i * 4 + 3
    }

    /**
     *
     * @param {string} type
     */
    const initBuffer = (type) => {
      const total = 0
      const aVertexColor = allocFloat32(type + '|aVertexColor', totalVertex * 4)
      const aVertexPosition = allocFloat32(type + '|aVertexPosition', totalVertex * 2)
      const aVertexType = allocFloat32(type + '|aVertexType', totalVertex * 1)
      const aVertexThreshold = allocFloat32(type + '|aVertexThreshold', totalVertex * 2)
      const aVertexOffset = allocFloat32(type + '|aVertexOffset', totalVertex * 2)

      const info = {
        total,
        aVertexColor,
        aVertexPosition,
        aVertexType,
        aVertexThreshold,
        aVertexOffset
      }

      types[type] = info
    }

    initBuffer('circle')
    initBuffer('circle_hollow')
    initBuffer('square')
    initBuffer('square_hollow')
    initBuffer('text')
    initBuffer('image')
    initBuffer('image_low')
    initBuffer('image_bg')

    for (const region in g.regions) {
      /**
       * @type { WebGLRenderingContext }
       */
      const gl = g.gl
      const currentRegion = g.regions[region]
      const lineWidth = g.regions[region].scale < 1 ? (1 / g.regions[region].scale + 1) : 2

      /**
       * @type {{ [key: string]: TextureRequest }}
       */
      const requests = {}

      for (let e of getByComponent('draw')) {
        let d = e
        do {
          if (d.drawType === 'text' && e.region === region) {
            requests[d.draw_id] = {
              fillStyle: `rgba(${d.draw_r * 255}, ${d.draw_g * 255}, ${d.draw_b * 255}, ${d.draw_a})`,
              text: d.text,
              textBaseline: "middle",
              textAlign: "center",
              font: d.textFont
            }
          }
        } while (d = d.draw_next)
      }

      /**
       * @type {StitchedTexture}
       */
      let res

      if (Object.keys(requests).length > 0) {
        res = generateTexture(gl, g.programs.object_text.buffers.tImage, region, requests)
      } else {
        res = /** @type {StitchedTexture} */(/** @type {unknown} */(null))
      }

      for (let e of getByComponent('draw')) {
        if (e.region === region) {
          let d = e
          do {
            switch (d.drawType) {
              case 'ball': {
                const current = types.circle
                const i = current.total++;
                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)
                current.aVertexPosition.set([
                  e.x - d.radius, e.y - d.radius,
                  e.x + d.radius, e.y - d.radius,
                  e.x - d.radius, e.y + d.radius,
                  e.x + d.radius, e.y + d.radius,
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_CIRCLE,
                  TYPE_CIRCLE,
                  TYPE_CIRCLE,
                  TYPE_CIRCLE,
                ], i * 1 * 4)
                current.aVertexThreshold.set([
                  1, 0,
                  1, 0,
                  1, 0,
                  1, 0,
                ], i * 2 * 4)
                current.aVertexOffset.set([
                  -1, -1,
                  1, -1,
                  -1, 1,
                  1, 1,
                ], i * 2 * 4)
              } break;
              case 'ball_s': {
                const current = types.circle_hollow
                const i = current.total++;
                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)
                current.aVertexPosition.set([
                  e.x - d.radius, e.y - d.radius,
                  e.x + d.radius, e.y - d.radius,
                  e.x - d.radius, e.y + d.radius,
                  e.x + d.radius, e.y + d.radius,
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_HOLLOW_CIRCLE,
                  TYPE_HOLLOW_CIRCLE,
                  TYPE_HOLLOW_CIRCLE,
                  TYPE_HOLLOW_CIRCLE,
                ], i * 1 * 4)
                const percent = (d.radius - lineWidth) / d.radius;
                current.aVertexThreshold.set([
                  1, percent,
                  1, percent,
                  1, percent,
                  1, percent,
                ], i * 2 * 4)
                current.aVertexOffset.set([
                  -1, -1,
                  1, -1,
                  -1, 1,
                  1, 1,
                ], i * 2 * 4)
              } break;
              case 'block': {
                const current = types.square
                const i = current.total++;
                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)
                current.aVertexPosition.set([
                  e.x + d.bx1, e.y + d.by1,
                  e.x + d.bx2, e.y + d.by1,
                  e.x + d.bx1, e.y + d.by2,
                  e.x + d.bx2, e.y + d.by2,
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_SQUARE,
                  TYPE_SQUARE,
                  TYPE_SQUARE,
                  TYPE_SQUARE,
                ], i * 1 * 4)
                current.aVertexThreshold.set([
                  0, 0,
                  0, 0,
                  0, 0,
                  0, 0,
                ], i * 2 * 4)
                current.aVertexOffset.set([
                  -1, -1,
                  1, -1,
                  -1, 1,
                  1, 1,
                ], i * 2 * 4)
              } break;
              case 'block_s': {
                const current = types.square_hollow
                const i = current.total++;
                const width = Math.abs(d.bx2 - d.bx1)
                const height = Math.abs(d.by2 - d.by1)

                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)
                current.aVertexPosition.set([
                  e.x + d.bx1, e.y + d.by1,
                  e.x + d.bx2, e.y + d.by1,
                  e.x + d.bx1, e.y + d.by2,
                  e.x + d.bx2, e.y + d.by2,
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_HOLLOW_SQUARE,
                  TYPE_HOLLOW_SQUARE,
                  TYPE_HOLLOW_SQUARE,
                  TYPE_HOLLOW_SQUARE,
                ], i * 1 * 4)
                current.aVertexThreshold.set([
                  1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
                  1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
                  1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
                  1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
                ], i * 2 * 4)
                current.aVertexOffset.set([
                  -1, -1,
                  1, -1,
                  -1, 1,
                  1, 1,
                ], i * 2 * 4)
              } break;
              case 'text': {
                const current = types.text
                const i = current.total++;

                const textureData = res.positions[d.draw_id]

                const width = textureData.width
                const height = textureData.height
                const x = e.x - (textureData.xOrigin - textureData.x)
                const y = e.y - (textureData.yOrigin - textureData.y)

                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)
                current.aVertexPosition.set([
                  x, y,
                  x + width, y,
                  x, y + height,
                  x + width, y + height,
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_IMG,
                  TYPE_IMG,
                  TYPE_IMG,
                  TYPE_IMG,
                ], i * 1 * 4)
                // not used
                current.aVertexThreshold.set([
                  0, 0,
                  0, 0,
                  0, 0,
                  0, 0,
                ], i * 2 * 4)
                current.aVertexOffset.set([
                  textureData.x / res.width, textureData.y / res.height,
                  (textureData.x + textureData.width) / res.width, textureData.y / res.height,
                  textureData.x / res.width, (textureData.y + textureData.height) / res.height,
                  (textureData.x + textureData.width) / res.width, (textureData.y + textureData.height) / res.height,
                ], i * 2 * 4)
              } break;
              case 'image_bg':
              case 'image_low':
              case 'image': {
                const current = types[d.drawType]
                const i = current.total++;

                const indexs = [
                  0, 1,
                  2, 3,
                  6, 7,
                  4, 5,

                  8, 9,
                  10, 11,
                  12, 13
                ]

                /**
                 * @param {T[]} arr
                 * @param {number} offset
                 * @template T
                 * @returns {T[]}
                 */
                function rotationInPlace (arr, offset) {
                  offset = ((offset % arr.length) + arr.length) % arr.length
                  if (offset === 0) {
                    return arr
                  }

                  const length = arr.length

                  for (let i = length + offset - 1; i >= offset; i--) {
                    arr[indexs[i]] = arr[indexs[i - offset]]
                  }

                  for (let i = offset - 1; i >= 0; i--) {
                    arr[indexs[i]] = arr[indexs[i + length]]
                  }

                  arr.length = length

                  return arr
                }

                let baseRotation = 0
                let textureData

                const image = d.image

                if (Array.isArray(image)) {
                  const frame = image[e.age % image.length]
                  textureData = textureAtlasInfo.frames[frame[0]].frame
                  baseRotation = frame[1]
                } else {
                  textureData =  textureAtlasInfo.frames[image].frame
                }

                const x = e.x
                const y = e.y
                const x1 = e.x + d.bx1
                const y1 = e.y + d.by1
                const x2 = e.x + d.bx2
                const y2 = e.y + d.by2

                current.aVertexColor.set([
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                  d.draw_r, d.draw_g, d.draw_b, d.draw_a,
                ], i * 4 * 4)

                current.aVertexPosition.set([
                  ...rotate(x1, y1, x, y, d.draw_rotation),
                  ...rotate(x2, y1, x, y, d.draw_rotation),
                  ...rotate(x1, y2, x, y, d.draw_rotation),
                  ...rotate(x2, y2, x, y, d.draw_rotation)
                ], i * 2 * 4)
                current.aVertexType.set([
                  TYPE_IMG,
                  TYPE_IMG,
                  TYPE_IMG,
                  TYPE_IMG,
                ], i * 1 * 4)
                // not used
                current.aVertexThreshold.set([
                  0, 0,
                  0, 0,
                  0, 0,
                  0, 0,
                ], i * 2 * 4)
                current.aVertexOffset.set(rotationInPlace([
                  textureData.x / textureAtlasWidth,
                  textureData.y / textureAtlasHeight,
                  (textureData.x + textureData.w) / textureAtlasWidth,
                  textureData.y / textureAtlasHeight,
                  textureData.x / textureAtlasWidth,
                  (textureData.y + textureData.h) / textureAtlasHeight,
                  (textureData.x + textureData.w) / textureAtlasWidth,
                  (textureData.y + textureData.h) / textureAtlasHeight,
                ], -baseRotation * 2), i * 2 * 4)
              } break;
            }
          } while (d = d.draw_next)
        }
      }

      for (let type of ['image_bg', 'image_low', 'square', 'square_hollow', 'circle', 'circle_hollow', 'image', 'text']) {
        const total = types[type].total
        if (total === 0) {
          continue
        }
        const aVertexColor = types[type].aVertexColor
        const aVertexOffset = types[type].aVertexOffset
        const aVertexPosition = types[type].aVertexPosition
        const aVertexThreshold = types[type].aVertexThreshold
        const aVertexType = types[type].aVertexType

        const current = g.programs[`object_${type}`]

        /**
         *
         * @param {string} name
         * @param {number} numComponents
         * @param {ArrayBuffer} buffer
         * @param {number} length
         */
        const setVertex = (name, numComponents, buffer, length) => {
          const type = gl.FLOAT;    // the data in the buffer is 32bit floats
          const normalize = false;  // don't normalize
          const stride = 0;         // how many bytes to get from one set of values to the next
          // 0 = use type and numComponents above
          const offset = 0;         // how many bytes inside the buffer to start from
          gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers[name]);

          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(buffer, 0, length),
            gl.STATIC_DRAW
          );

          gl.bindBuffer(gl.ARRAY_BUFFER, current.buffers[name]);
          gl.vertexAttribPointer(
            current.data[name],
            numComponents,
            type,
            normalize,
            stride,
            offset);
          gl.enableVertexAttribArray(
            current.data[name]
          );
        }

        gl.viewport(
          currentRegion.left * g.dpi,
          currentRegion.top * g.dpi,
          currentRegion.width * currentRegion.scale * g.dpi,
          currentRegion.height * currentRegion.scale * g.dpi
        )

        gl.enable(gl.BLEND)
        gl.enable(gl.SCISSOR_TEST);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.scissor(
          currentRegion.left * g.dpi,
          currentRegion.top * g.dpi,
          currentRegion.width * currentRegion.scale * g.dpi,
          currentRegion.height * currentRegion.scale * g.dpi
        )

        const projectionMatrix = new Float32Array([
          2 / currentRegion.width, 0, 0, 0,
          0, -2 / currentRegion.height, 0, 0,
          0, 0, 1, -1,
          -1, 1, 0, 0,
        ])

        const modelViewMatrix = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, -1, 1,
        ])

        setVertex('aVertexColor', 4, aVertexColor.buffer, total * 4 * 4)
        setVertex('aVertexPosition', 2, aVertexPosition.buffer, total * 2 * 4)
        setVertex('aVertexType', 1, aVertexType.buffer, total * 1 * 4)
        setVertex('aVertexThreshold', 2, aVertexThreshold.buffer, total * 2 * 4)
        setVertex('aVertexOffset', 2, aVertexOffset.buffer, total * 2 * 4)

        gl.useProgram(current.program);

        gl.uniformMatrix4fv(
          current.data.uProjectionMatrix,
          false,
          projectionMatrix
        );

        gl.uniformMatrix4fv(
          current.data.uModelViewMatrix,
          false,
          modelViewMatrix
        );

        {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, current.buffers.eIndex);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(eIndex.buffer, 0, total * 6), gl.STATIC_DRAW);
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, current.buffers.tImage)

        {
          const vertexCount = total * 6;
          const type = gl.UNSIGNED_SHORT;
          const offset = 0;
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }


        gl.disable(gl.BLEND)
        gl.disable(gl.SCISSOR_TEST);
      }
    }
  }
})
