components.draw = (e) => {
  e.drawType = '' // 'ball' | 'block' | 'text'

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
}
