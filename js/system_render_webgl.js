

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

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
    if (current && size * 2 <= current.byteLength ) {
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
    if (current && size * 4 <= current.byteLength ) {
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
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

const TYPE_SQUARE = 1
const TYPE_HOLLOW_SQUARE = 2
const TYPE_CIRCLE = 3

systems.push({
  name: 'render',
  dependsOn: ['regions'],
  /**
   * @param {{ ctx: CanvasRenderingContext2D }} g
   */
  init(g) {
    // global resize callback
    g.resizeCb = nuzz

    g.dpi = (window.devicePixelRatio || 1) * msaa

    g.canvas = document.getElementById('canvas')

    /**
     * @type { WebGL2RenderingContext }
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

    {
      const current = {}
      g.programs.objects = current
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
          precision mediump float;

          varying vec4 fColor;
          varying float fType;
          varying vec2 fThreshold;
          varying vec2 fOffset;

          void main() {
            if (fType == ${TYPE_SQUARE}.0) {
              // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
              gl_FragColor = fColor;
            } else if (fType == ${TYPE_HOLLOW_SQUARE}.0) {
              // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
              gl_FragColor = abs(fOffset.x) > fThreshold.x || abs(fOffset.y) > fThreshold.y
                ? fColor
                : vec4(0.0, 0.0, 0.0, 0.0);
            } else if (fType == ${TYPE_CIRCLE}.0) {
              gl_FragColor = length(fOffset) < fThreshold.x
                ? fColor
                : vec4(0.0, 0.0, 0.0, 0.0);
            }  else {
              gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
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
        uModelViewMatrix: gl.getUniformLocation(current.program, 'uModelViewMatrix')
      }

      current.buffers = {
        eIndex: gl.createBuffer(),
        aVertexPosition: gl.createBuffer(),
        aVertexColor: gl.createBuffer(),
        aVertexType: gl.createBuffer(),
        aVertexThreshold: gl.createBuffer(),
        aVertexOffset: gl.createBuffer()
      }
    }

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
   * @param {{ ctx: CanvasRenderingContext2D, regions: Record<string, { top: number, left: number, width: number, height: number, scale: number} }} g
   */
  tick(s, g) {
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
       * @type { WebGL2RenderingContext }
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
        1, 0, 1,
        1, 0, 1,
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

    const totalVertex = getByComponent('draw').size * 4;

    const eIndex = allocUint16('eIndex', totalVertex / 2 * 3)
    const aVertexColor = allocFloat32('aVertexColor', totalVertex * 4)
    const aVertexPosition = allocFloat32('aVertexPosition', totalVertex * 2)
    const aVertexType = allocFloat32('aVertexType', totalVertex * 1)
    const aVertexThreshold = allocFloat32('aVertexThreshold', totalVertex * 2)
    const aVertexOffset = allocFloat32('aVertexOffset', totalVertex * 2)

    for (let i = 0; i < totalVertex / 4; i++) {
      eIndex[i * 6 + 0] = i * 4 + 0
      eIndex[i * 6 + 1] = i * 4 + 1
      eIndex[i * 6 + 2] = i * 4 + 2
      eIndex[i * 6 + 3] = i * 4 + 1
      eIndex[i * 6 + 4] = i * 4 + 2
      eIndex[i * 6 + 5] = i * 4 + 3
    }

    for (const region in g.regions) {

      const lineWidth = region.scale < 1 ? (1 / region.scale) : 1

      let total = 0
      for (let e of getByComponent('draw')) {
        if (e.drawType === 'ball' && e.region === region) {
          const i = total++;
          aVertexColor.set([
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
          ], i * 4 * 4)
          aVertexPosition.set([
            e.x - e.radius, e.y - e.radius,
            e.x + e.radius, e.y - e.radius,
            e.x - e.radius, e.y + e.radius,
            e.x + e.radius, e.y + e.radius,
          ], i * 2 * 4)
          aVertexType.set([
            TYPE_CIRCLE,
            TYPE_CIRCLE,
            TYPE_CIRCLE,
            TYPE_CIRCLE,
          ], i * 1 * 4)
          aVertexThreshold.set([
            1, 0,
            1, 0,
            1, 0,
            1, 0,
          ], i * 2 * 4)
          aVertexOffset.set([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
          ], i * 2 * 4)
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'block' && e.region === region) {
          const i = total++;
          aVertexColor.set([
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
          ], i * 4 * 4)
          aVertexPosition.set([
            e.x + e.bx1, e.y + e.by1,
            e.x + e.bx2, e.y + e.by1,
            e.x + e.bx1, e.y + e.by2,
            e.x + e.bx2, e.y + e.by2,
          ], i * 2 * 4)
          aVertexType.set([
            TYPE_SQUARE,
            TYPE_SQUARE,
            TYPE_SQUARE,
            TYPE_SQUARE,
          ], i * 1 * 4)
          aVertexThreshold.set([
            0, 0,
            0, 0,
            0, 0,
            0, 0,
          ], i * 2 * 4)
          aVertexOffset.set([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
          ], i * 2 * 4)
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'block_s' && e.region === region) {
          const i = total++;
          const width = Math.abs(e.bx2 - e.bx1)
          const height = Math.abs(e.by2 - e.by1)

          aVertexColor.set([
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
            1, 1, 1, 0.5,
          ], i * 4 * 4)
          aVertexPosition.set([
            e.x + e.bx1, e.y + e.by1,
            e.x + e.bx2, e.y + e.by1,
            e.x + e.bx1, e.y + e.by2,
            e.x + e.bx2, e.y + e.by2,
          ], i * 2 * 4)
          aVertexType.set([
            TYPE_HOLLOW_SQUARE,
            TYPE_HOLLOW_SQUARE,
            TYPE_HOLLOW_SQUARE,
            TYPE_HOLLOW_SQUARE,
          ], i * 1 * 4)
          aVertexThreshold.set([
            1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
            1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
            1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
            1 - lineWidth * 2 / width, 1 - lineWidth * 2 / height,
          ], i * 2 * 4)
          aVertexOffset.set([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
          ], i * 2 * 4)
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'text' && e.region === region) {
        }
      }

      if (total === 0) {
        continue
      }

      const currentRegion = g.regions[region]

      /**
       * @type { WebGL2RenderingContext }
       */
      const gl = g.gl
      const current = g.programs.objects

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
        currentRegion.left,
        currentRegion.top,
        currentRegion.width * currentRegion.scale,
        currentRegion.height * currentRegion.scale
      )

      gl.enable(gl.BLEND)
      gl.enable(gl.SCISSOR_TEST);

      gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
      gl.scissor(
        currentRegion.left,
        currentRegion.top,
        currentRegion.width * currentRegion.scale,
        currentRegion.height * currentRegion.scale
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
})
