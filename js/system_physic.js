systems.push({
  name: 'physic',
  tick(s) {
    for (let e of getByComponent('physic')) {
      e.vx += e.ax * s
      e.vy += e.ay * s

      e.x += e.vx * s
      e.y += e.vy * s
    }
  }
})