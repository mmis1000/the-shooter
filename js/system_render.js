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

    g.ctx.save()

    // g.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    // for (let e of getByComponent ('draw')) {
    //   switch (e.drawType) {
    //     case 'drop':
    //       g.ctx.save()
    //       g.ctx.translate(e.x, e.y)
    //       g.ctx.rotate(-Math.atan(e.vx / e.vy))
    //       g.ctx.fillRect(-0.5, -tailLength, 1, tailLength);
    //       g.ctx.restore()
    //       break
    //   }
    // }

    g.ctx.strokeStyle = "rgba(255, 255, 255, 1)";
    for (let e of getByComponent ('draw')) {
      if (e.drawType === 'ball') {
        if (e.region) {
          g.ctx.save()
          g.ctx.translate(g.regions[e.region].left, g.regions[e.region].top)
          g.ctx.scale(g.regions[e.region].scale, g.regions[e.region].scale)
        }

        g.ctx.beginPath();
        g.ctx.arc(e.x, e.y, e.radius, 0, 2 * Math.PI);
        g.ctx.stroke();

        if (e.region) {
          g.ctx.restore()
        }
      }
    }

    g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let e of getByComponent ('draw')) {
      if (e.drawType === 'block') {
        if (e.region) {
          g.ctx.save()
          g.ctx.translate(g.regions[e.region].left, g.regions[e.region].top)
          g.ctx.scale(g.regions[e.region].scale, g.regions[e.region].scale)
        }

        g.ctx.fillRect(e.x + e.bx1, e.y + e.by1, e.bx2 - e.bx1, e.by2 - e.by1);

        if (e.region) {
          g.ctx.restore()
        }
      }
    }

    g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let e of getByComponent ('draw')) {
      if (e.drawType === 'text') {
        if (e.region) {
          g.ctx.save()
          g.ctx.translate(g.regions[e.region].left, g.regions[e.region].top)
          g.ctx.scale(g.regions[e.region].scale, g.regions[e.region].scale)
        }

        g.ctx.font = e.textFont
        g.ctx.textBaseline = "middle"
        g.ctx.textAlign = "center"
        g.ctx.fillText(e.text, e.x, e.y);

        if (e.region) {
          g.ctx.restore()
        }
      }
    }


    // g.ctx.font = "30px Arial";
    // g.ctx.strokeText((s * 1000).toFixed(2) + "ms", 10, 50);

    g.ctx.restore()

    g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)
    g.bufferCtx.drawImage(g.canvas, 0, 0)
  }
})
