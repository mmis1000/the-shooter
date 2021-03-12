let draw_id = 1

components.draw = (e) => {
  let data

  if (!e.draw_id) {
    data = e
  } else {
    while (e.draw_next !== null) {
      e = e.draw_next
    }

    data = {}
    e.draw_next = data
  }

  data.drawType = '' // 'ball' | 'block' | 'text'
  data.draw_id = draw_id++

  // block
  data.bx1 = 0
  data.bx2 = 0
  data.by1 = 0
  data.by2 = 0

  // ball
  data.radius = 0

  // text
  data.text = ''
  data.textFont = '60px Arial'

  data.draw_next = null

  return data
}
