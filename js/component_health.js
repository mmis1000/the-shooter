function defaultHpCb (e) {
  if (e.health <= 0) {
    destroy(e)
  }
}

components.health = (e) => {
  e.has_health = true
  e.health_cb = defaultHpCb
  e.health = 1
  e.health_zone = 'world'
}
