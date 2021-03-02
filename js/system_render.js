systems.push({
  name: 'render',
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
    g.ctx.save()
    
    window.addEventListener('resize', () => {
      g.dpi = (window.devicePixelRatio || 1) * msaa
      g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)

      g.windowWidth = Math.max(window.innerWidth, 1)
      g.windowHeight = Math.max(window.innerHeight, 1)

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
      switch (e.drawType) {
        case 'ball': 
          g.ctx.beginPath();
          g.ctx.arc(e.x, e.y, e.radius, 0, 2 * Math.PI);
          g.ctx.stroke(); 
          break
      }
    }
      
    for (let e of getByComponent ('draw')) {
      switch (e.drawType) {
        case 'block': 
          g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
          g.ctx.fillRect(e.x + e.bx1, e.y + e.by1, e.bx2 - e.bx1, e.by2 - e.by1);
          break
      }
    }
      
    g.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let e of getByComponent ('draw')) {
      switch (e.drawType) {
        case 'text': 
          g.ctx.font = e.textFont
          g.ctx.textBaseline = "middle"
          g.ctx.textAlign = "center"
          g.ctx.fillText(e.text, e.x, e.y); 
          break
      }
    }
      
    
    // g.ctx.font = "30px Arial";
    // g.ctx.strokeText((s * 1000).toFixed(2) + "ms", 10, 50); 
    
    g.ctx.restore()
    
    g.bufferCtx.clearRect(0, 0, g.bufferCanvas.width, g.bufferCanvas.height)
    g.bufferCtx.drawImage(g.canvas, 0, 0)
  }
})