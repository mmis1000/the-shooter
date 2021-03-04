systems.push({
  name: 'damage',
  init(g) {
  },
  tick(s, g) {
    for (let e of getByComponent('damage')) {
      if (
        e.ctHitOn.has_heath
        && e.damage_zone === e.ctHitOn.health_zone
      ) {
        const target = e.ctHitOn
        target.health -= e.damage
        target.health_cb(target)
      }
    }
  }
})
