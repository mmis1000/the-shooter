systems.push({
  name: 'event',
  init(g) {
    g.cb = nuzz
  },
  tick(s, g) {
    for (let e of getByComponent('event')) {
      e.cb(e, g, s)
    }
    g.cb(g, s)
  }
})