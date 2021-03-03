systems.push({
  name: 'regions',
  init (g) {
    g.regions = {
      'window': {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1
      }
      /**
       * regionA: {
       *   top: 0,
       *   left: 0,
       *   width: 720,
       *   height: 1080,
       *   scale: 1.5
       * }
       */
    }
  }
})

function globalToLocal(
  // original pos
  x, y,

  // mapping to actual pos
  top, left,
  scale
) {
  return {
    x: (x - left) / scale,
    y: (y - top) / scale
  }
}

function localToGlobal(
  // original local pos
  localX, localY,

  // mapping to actual pos
  top, left,
  scale
) {
  return {
    x: left + localX * scale,
    y: top + localY * scale
  }
}
