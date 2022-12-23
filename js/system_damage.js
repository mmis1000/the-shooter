systems.push({
  name: 'damage',
  init(g) {
  },
  tick(s, g) {
    for (let e of getByComponent('damage')) {
      if (
        e.ctHitOn
        && e.ctHitOn.has_health
        && e.damage_zone === e.ctHitOn.health_zone
      ) {
        const target = e.ctHitOn
        target.health -= e.damage

        e.damage_cb(e, g, s)
        target.health_cb(target, g, s)
      }
    }
  }
})
