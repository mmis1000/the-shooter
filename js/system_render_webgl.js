

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
    gl.clear(gl.COLOR_BUFFER_BIT);

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
        aVertexPosition: gl.getAttribLocation(g.programs.background.program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(g.programs.background.program, 'aVertexColor'),
        uProjectionMatrix: gl.getUniformLocation(g.programs.background.program, 'uProjectionMatrix'),
        uModelViewMatrix: gl.getUniformLocation(g.programs.background.program, 'uModelViewMatrix')
      }

      current.buffers = {
        aVertexPosition: gl.createBuffer(),
        aVertexColor: gl.createBuffer()
      }
    }

    window.addEventListener('resize', () => {
      g.dpi = (window.devicePixelRatio || 1) * msaa
      g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)

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

      gl.viewport(0, 0, g.canvas.width, g.canvas.height)

      // 設定清除色彩為黑色，完全不透明
      g.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      // 透過清除色來清除色彩緩衝區
      g.gl.clear(gl.COLOR_BUFFER_BIT);

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
      const gl = g.gl
      const current = g.programs.background

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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

    for (const region in g.regions) {
      for (let e of getByComponent('draw')) {
        if (e.drawType === 'ball' && e.region === region) {
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'block' && e.region === region) {
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'block_s' && e.region === region) {
        }
      }

      for (let e of getByComponent('draw')) {
        if (e.drawType === 'text' && e.region === region) {
        }
      }
    }
  }
})
