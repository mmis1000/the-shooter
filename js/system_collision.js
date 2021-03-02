systems.push({
  name: 'collision',
  tick(s) {
    for (let e of getByComponent('collisionTarget')) {
      let collided = false
      let collidedOn = null

      for (let t of getByComponent('collisionSource')) {
        let collideOnThis = false
        if (e.cType === 'block') {
          if (t.cType === 'block') {
            collideOnThis = (
              (t.cBx2 + t.x - e.cBx1 - e.x) * (e.cBx2 + e.x - t.cBx1 - t.x) >= 0 &&
              (t.cBy2 + t.y - e.cBy1 - e.y) * (e.cBy2 + e.y - t.cBy1 - t.y) >= 0
            )
          } else if (t.cType === 'ball') {
            // Todo
          }
        } else if (e.cType === 'ball') {
          if (t.cType === 'block') {
            // Todo
          } else if (t.cType === 'ball') {
            collideOnThis = (t.x - e.x) ** 2 + (t.y - e.y) ** 2 < (t.cRadius + e.cRadius) ** 2
          }
        }

        collided = collided || collideOnThis

        if (collideOnThis) {
          collidedOn = t
        }
      }

      e.ctCollided = collided
      e.ctHitOn = collidedOn
    }
  }
})