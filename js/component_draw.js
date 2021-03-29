let draw_id = 1

components.draw = (e) => {
  let data
  let currentSize

  if (!e.draw_id) {
    data = e
    currentSize = 0
  } else {
    currentSize = 1
    while (e.draw_next !== null) {
      e = e.draw_next
      currentSize++
    }

    data = {}
    e.draw_next = data
  }

  data.drawType = '' // 'ball' | 'block' | 'text' | 'image'
  data.draw_id = draw_id++
  data.draw_rotation = 0 // in radius

  // block & image
  data.bx1 = 0
  data.bx2 = 0
  data.by1 = 0
  data.by2 = 0

  // ball
  data.radius = 0

  // text
  data.text = ''
  data.textFont = '60px Arial'

  // image
  data.image = ''

  data.draw_next = null

  data.draw_r = 1
  data.draw_g = 1
  data.draw_b = 1
  data.draw_a = 0.5

  e.draw_size = currentSize + 1

  return data
}
