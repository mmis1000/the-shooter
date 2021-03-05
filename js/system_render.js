systems.push({
  name: 'render',
  dependsOn: ['regions'],
  /**
   * @param {{ ctx: CanvasRenderingContext2D }} g
   */
  init (g) {
    // global resize callback
    g.resizeCb = nuzz

    g.dpi = (window.devicePixelRatio || 1) * msaa

    g.canvas = document.getElementById('canvas')
    g.ctx= g.canvas.getContext('2d')

    g.bufferCanvas = document.createElement('canvas')
    g.bufferCtx = g.bufferCanvas.getContext('2d')

    g.windowWidth = Math.max(window.innerWidth, 1)
    g.windowHeight = Math.max(window.innerHeight, 1)

    g.canvas.width = g.windowWidth * g.dpi
    g.canvas.height = g.windowHeight * g.dpi

    g.bufferCanvas.width = g.windowWidth * g.dpi
    g.bufferCanvas.height = g.windowHeight * g.dpi

    g.ctx.scale(g.dpi, g.dpi);
    g.ctx.save();

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

      g.bufferCanvas.width = g.windowWidth * g.dpi
      g.bufferCanvas.height = g.windowHeight * g.dpi

      g.ctx.clearRect(0, 0, g.canvas.width, g.canvas.height)
      g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)

      g.ctx.restore()
      g.ctx.scale(g.dpi, g.dpi);
      g.ctx.save()

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
  tick (s, g) {
    var grd = g.ctx.createLinearGradient(0, 0, 0, g.windowHeight);

    grd.addColorStop(0, "#002");
    grd.addColorStop(1, "#000");
    g.ctx.fillStyle = grd
    g.ctx.fillRect(0, 0, g.windowWidth, g.windowHeight);

    g.ctx.globalAlpha = 0.5;
    g.ctx.drawImage(
      g.bufferCanvas,
      0, 0,
      g.windowWidth * g.dpi, g.windowHeight * g.dpi,
      0, 0,
      g.windowWidth, g.windowHeight
    )
    g.ctx.globalAlpha = 1;

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    const clipRect = (ctx, width, height) => {
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width, 0)
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.clip()
    }

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

    for (const region in g.regions) {
      g.ctx.save()
      g.ctx.translate(g.regions[region].left, g.regions[region].top)
      g.ctx.scale(g.regions[region].scale, g.regions[region].scale)
      clipRect(g.ctx, g.regions[region].width, g.regions[region].height)

      const lineWidth = Math.max(1 / g.regions[region].scale, 1)

      g.ctx.lineWidth = lineWidth

      g.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
      for (let e of getByComponent ('draw')) {
        if (e.drawType === 'ball' && e.region === region) {
          const { x, y } = correctPosition(e, g)

          g.ctx.beginPath();
          g.ctx.arc(x, y, e.radius, 0, 2 * Math.PI);
          g.ctx.stroke();
        }
      }

      g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      for (let e of getByComponent ('draw')) {
        if (e.drawType === 'block' && e.region === region) {
          const { x, y } = correctPosition(e, g)

          g.ctx.fillRect(x + e.bx1, y + e.by1, e.bx2 - e.bx1, e.by2 - e.by1);
        }
      }

      g.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      for (let e of getByComponent ('draw')) {
        if (e.drawType === 'block_s' && e.region === region) {
          const { x, y } = correctPosition(e, g)

          g.ctx.strokeRect(x + e.bx1, y + e.by1, e.bx2 - e.bx1, e.by2 - e.by1);
        }
      }

      g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      for (let e of getByComponent ('draw')) {
        if (e.drawType === 'text' && e.region === region) {
          const { x, y } = correctPosition(e, g)

          g.ctx.font = e.textFont
          g.ctx.textBaseline = "middle"
          g.ctx.textAlign = "center"
          g.ctx.fillText(e.text, x, y);
        }
      }

      g.ctx.restore()
    }

    g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)
    g.bufferCtx.drawImage(g.canvas, 0, 0)
  }
})
