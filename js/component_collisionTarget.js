components.collisionTarget = (e) => {
  // ct -> collisionTarget
  e.ct = true
  e.ctCollided = false
  e.ctHitOn = null

  // c -> collision
  e.cType = 'block' //'ball' | 'block'

  // block
  e.cBx1 = 0
  e.cBx2 = 0
  e.cBy1 = 0
  e.cBy2 = 0

  // ball
  e.cRadius = 0
}
