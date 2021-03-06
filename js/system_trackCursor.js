const updatePositions = (g, x, y, down = false) => {
  g.mouseX = x
  g.mouseY = y
  g.clickDown = down || g.clickDown

  for (let region in g.regions) {
    const { x: localX, y: localY } = globalToLocal(x, y, g.regions[region].top, g.regions[region].left, g.regions[region].scale)
    if (
      localX >= 0 && localX < g.regions[region].width &&
      localY >= 0 && localY < g.regions[region].height
    ) {
      g.mouseRegions[region] = {
        x: localX,
        y: localY,
        clickDown: down || (g.mouseRegions[region]?.clickDown ?? false)
      }
    } else {
      g.mouseRegions[region] = {
        x: -1,
        y: -1,
        clickDown: false
      }
    }
  }
}

const startTouchMouseMode = (g, x, y) => {
  updatePositions(g, x, y)
  g.touchMouseBase = { x, y }
  g.touchRelativeMode = true
}
const exitTouchMouseMode = (g) => {
  g.touchRelativeMode = false
}

systems.push({
  name: 'trackCursor',
  dependsOn: ['regions'],
  init(g) {
    g.hasTouch = false
    g.touchRelativeMode = false
    g.touchMouseBase = null
    g.touchTouchBase = null
    g.touchRaw = null
    g.mouseRegions = {
      /**
       * regionA: {
       *   x: 0,
       *   y: 0,
       *   clickDown: false
       * }
       */
    }

    updatePositions(-1, -1, false)

    g.canvas.addEventListener('mousedown', function (e) {
      if (g.hasTouch) return
      const rect = g.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePositions(g, x, y, true)
    })

    g.canvas.addEventListener('mousemove', function (e) {
      if (g.hasTouch) return
      const rect = g.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updatePositions(g, x, y)
    })

    g.canvas.addEventListener('touchstart', function (e) {
      g.hasTouch = true;

      const rect = g.canvas.getBoundingClientRect();
      const t = e.touches[0]
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;

      g.touchTouchBase = { x, y }
      g.touchMouseBase = { x: g.mouseX, y: g.mouseY }
      if (g.touchRelativeMode) {
        // do nothing
      } else {
        updatePositions(g, x, y, true)
      }
    })

    g.canvas.addEventListener('touchmove', function (e) {
      const rect = g.canvas.getBoundingClientRect();
      const t = e.touches[0]
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      if (g.touchRelativeMode) {
        updatePositions(
          g,
          g.touchMouseBase.x + x - g.touchTouchBase.x,
          g.touchMouseBase.y + y - g.touchTouchBase.y
        )
      } else {
        updatePositions(g, x, y)
      }
    })
  },
  tick(s, g) {
    for (let e of getByComponent('trackCursor')) {
      let x = e.region ? g.mouseRegions[e.region].x : g.mouseX
      let y = e.region ? g.mouseRegions[e.region].y : g.mouseY
      if (x > 0 && y > 0) {
        if (
          e.trackCursorMaxDistance
          && (e.x - x) ** 2 + (e.y - y) ** 2 > e.trackCursorMaxDistance ** 2
        ) {
          let dx = x - e.x
          let dy = y - e.y
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
    }

    // clickEvent
    if (g.clickDown) {
      let x = g.mouseX
      let y = g.mouseY

      for (let e of getByComponent('clickEvent')) {
        if (
          e.region === ''
          && e.clickBx1 + e.x < x
          && e.clickBx2 + e.x > x
          && e.clickBy1 + e.y < y
          && e.clickBy2 + e.y > y
        ) {
          e.clickCb(e, g, s)
        }
      }

      g.clickDown = false
    }

    for (let region in g.mouseRegions) {
      if (g.mouseRegions[region].clickDown) {
        let x = g.mouseRegions[region].x
        let y = g.mouseRegions[region].y
        for (let e of getByComponent('clickEvent')) {
          if (
            e.region === region
            && e.clickBx1 + e.x < x
            && e.clickBx2 + e.x > x
            && e.clickBy1 + e.y < y
            && e.clickBy2 + e.y > y
          ) {
            e.clickCb(e, g, s)
          }
        }
        g.mouseRegions[region].clickDown = false
      }
    }
  }
})
