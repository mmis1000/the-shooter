systems.push({
  name: 'trackCursor',
  init (g) {
    g.mouseX = -9999
    g.mouseY = -9999
    g.canvas.addEventListener('mousemove', function (e) {
      const rect = g.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      g.mouseX = x
      g.mouseY = y
    })
    g.canvas.addEventListener('touchmove', function (e) {
      const rect = g.canvas.getBoundingClientRect();
      const t = e.touches[0]
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      g.mouseX = x
      g.mouseY = y
    })
    g.canvas.addEventListener('mousedown', function (e) {
      const rect = g.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      g.mouseX = x
      g.mouseY = y
      g.clickDown = true
    })
    g.canvas.addEventListener('touchstart', function (e) {
      const rect = g.canvas.getBoundingClientRect();
      const t = e.touches[0]
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      g.mouseX = x
      g.mouseY = y
      g.clickDown = true
    })
  },
  tick (s, g) {
    for (let e of getByComponent ('trackCursor')) {
      let x = g.mouseX
      let y = g.mouseY
      if (e.trackCursorMaxDistance && (e.x - x) ** 2 + (e.y - y) ** 2 > e.trackCursorMaxDistance ** 2) {
        let dx =  x - e.x
        let dy =  y - e.y
        let oldLength = ((e.x - x) ** 2 + (e.y - y) ** 2) ** 0.5
        dx = dx / oldLength * e.trackCursorMaxDistance
        dy = dy / oldLength * e.trackCursorMaxDistance
        e.x += dx
        e.y += dy
      } else {
        e.x = x
        e.y = y
      }
    }
    
    // clickEvent
    if (g.clickDown) {
      for (let e of getByComponent ('clickEvent')) {
        let x = g.mouseX
        let y = g.mouseY
        if (
          e.clickBx1 + e.x < x &&
          e.clickBx2 + e.x > x &&
          e.clickBy1 + e.y < y &&
          e.clickBy2 + e.y > y 
        ) {
          e.clickCb(e, g, s)
        }
      }
      g.clickDown = false
    }
      
  }
})