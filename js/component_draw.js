let draw_id = 1

components.draw = (e) => {
  while (e.draw_next) {
    e = e.draw_next
  }

  e.drawType = '' // 'ball' | 'block' | 'text'
  e.draw_id = draw_id++

  // block
  e.bx1 = 0
  e.bx2 = 0
  e.by1 = 0
  e.by2 = 0

  // ball
  e.radius = 0

  // text
  e.text = ''
  e.textFont = '60px Arial'

  e.draw_next = null
}
