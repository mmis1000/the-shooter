function defaultHpCb (e) {
  if (e.hp < 0) {
    destroy(e)
  }
}

components.health = (e) => {
  e.has_health
  e.health_cb = defaultHpCb
  e.health = 4
  e.health_zone = 'world'
}
