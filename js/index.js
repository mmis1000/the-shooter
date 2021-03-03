init()
setup((g) => {
  g.regions['stage'] = {
    left: 0,
    top: 0,
    width: 360,
    height: 480,
    scale: 1
  }

  function projectileDestroyCb (e, g, s) {
    if (e.x < 0 || e.y < 0 || e.x > g.regions[e.region].width || e.y > g.regions[e.region].height) {
      destroy(e)
      return true
    } else {
      return false
    }
  }

  function killPlayer (e, g, s) {
    if (e.ctCollided && e.ctHitOn._.type === 'player' && !e.ctHitOn._.immune) {
      clear ()
      spawnHomeScreen ('You dead, try again')

      return true
    } else {
      return false
    }
  }

  // bullet cb
  function enemyBulletCb (e, g, s) {
    if (killPlayer(e, g, s)) return

    projectileDestroyCb (e, g, s)
  }

  function project(x, y, arc, distance = 100, base = 100, bulletRadius = 10) {
    const acc = 50

    var vector = {
      x: Math.cos(arc),
      y: Math.sin(arc)
    }

    const e = addEntity()

    addComponent(e, 'pos')
    e.x = x + vector.x * distance
    e.y = y + vector.y * distance
    addComponent(e, 'physic')
    e.vx = vector.x * base
    e.vy = vector.y * base
    e.ax = vector.x * acc
    e.ay = vector.y * acc

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = bulletRadius

    addComponent(e, 'event')
    e.cb = enemyBulletCb

    addComponent(e, 'collisionTarget')
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }

  function spawnBoss () {
    // spawner
    const e = g.boss = addEntity()

    addComponent(e, 'pos')
    e.x = g.regions[e.region].width / 2
    e.y = g.regions[e.region].height * 0.4

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 100

    addComponent(e, 'collisionTarget')
    addComponent(e, 'collisionSource')
    e.cType = 'ball'
    e.cRadius = 100

    // boss hp
    e._.hp = 50
    e._.hpMax = 50

    e._.type = 'enemy'

    addComponent(e, 'event')
    e._.interval = 10
    e._.age = 0
    e._.ageWake = 40

    e.cb = (e, g, s) => {
      e.radius = 100 + (Math.cos((e._.age / 10) * Math.PI * 2) + 1) * 5

      e.x = g.regions[e.region].width / 2 + Math.sin(e._.age / 20) * 100
      e.y = g.regions[e.region].height * 0.4 + Math.cos(e._.age / 20) * 100

      e._.age += 1

      if (e._.age < e._.ageWake) {
        return
      }

      if (killPlayer(e, g, s)) return

      if (e._.age % e._.interval === 0) {
        const count = e._.hp < 25 ? 12 : 8
        for (let i = 0; i < count; i++) {
          project(
            e.x,
            e.y,
            Math.PI * 2 / count * (i + e._.age / (120 + Math.PI)),
            100,
            e._.hp < 25 ? 150 : 100
          )
        }
      }


      if (e._.hp === 0) {
        destroy(e)
        destroy(g.healthBar)

        g.player._.immune = true

        for (let i = 0; i < 60; i++) {
          var direction = Math.PI * 2 / 60 * i
          project(e.x, e.y, direction)
        }

        g.countDown = 180
        g.cb = (g, s) => {
          g.countDown--
          if (g.countDown < 0) {
            clear()
            spawnHomeScreen ('You win, Click to start again')
          }
        }
      }
    }

  }

  function project2(x, y, arc, distance = 100, base = 100, bulletRadius = 10) {
    const acc = 0

    var vector = {
      x: Math.cos(arc),
      y: Math.sin(arc)
    }

    const e = addEntity()

    addComponent(e, 'pos')
    e.x = x + vector.x * distance
    e.y = y + vector.y * distance
    addComponent(e, 'physic')
    e.vx = vector.x * base
    e.vy = vector.y * base
    e.ax = vector.x * acc
    e.ay = vector.y * acc

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = bulletRadius

    addComponent(e, 'event')
    e.cb = enemyBulletCb

    addComponent(e, 'collisionTarget')
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }

  function straightBulletCb (e, g, s) {
      e.y = e._.age / e._.liveSpan * g.regions[e.region].height
      e._.age += 1

      if (e._.age < e._.ageWake) {
        return
      }

      if (killPlayer(e, g, s)) return
      if (projectileDestroyCb (e, g, s)) return

      if (e._.age % e._.interval === 0) {
        const count = 3
        for (let i = 0; i < count; i++) {
          project2(
            e.x + (i - (count - 1) / 2) * 80,
            e.y,
            Math.PI / 2,
            0,
            100,
            e._.bulletRadius
          )
        }
      }

      if (e._.hp === 0) {
        destroy(e)
      }
  }

  function swappingBulletCb (e, g, s) {
      e.y = e._.age / e._.liveSpan * g.regions[e.region].height
      e._.age += 1

      if (e._.age < e._.ageWake) {
        return
      }

      if (killPlayer(e, g, s)) return
      if (projectileDestroyCb (e, g, s)) return

      if (e._.age % e._.interval === 0) {
        const count = 3
        for (let i = 0; i < count; i++) {
          project2(
            e.x + (i - (count - 1) / 2) * 80,
            e.y,
            Math.PI / 2 + Math.cos(Math.PI * e._.age / e._.interval) * Math.PI / 10,
            0,
            100,
            e._.bulletRadius
          )
        }
      }

      if (e._.hp === 0) {
        destroy(e)
      }
  }

  function spawnSmall ({
    x = 0,
    radius = 20,
    hp = 2,
    interval = 20,
    liveSpan = 60 * 10, // 10 seconds
    cb = straightBulletCb,
    bulletRadius = 5,
    xCb = (e, g, s) => 0
  } = {
    x: 0,
    radius: 20,
    hp: 2,
    interval: 20,
    liveSpan: 60 * 5,
    cb: straightBulletCb,
    bulletRadius: 5,
    xCb: (e, g, s) => 0
  }) {
    const e = addEntity()

    addComponent(e, 'pos')
    e.x = g.regions[e.region].width / 2 + x
    e.y = 0

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = radius

    addComponent(e, 'collisionTarget')
    addComponent(e, 'collisionSource')
    e.cType = 'ball'
    e.cRadius = 20

    e._.hp = hp

    e._.type = 'enemy'

    addComponent(e, 'event')
    e._.interval = interval
    e._.age = 0
    e._.ageWake = 0
    e._.liveSpan = liveSpan
    e._.bulletRadius = bulletRadius

    e.cb = function (e, g, s) {
      e.x = g.regions[e.region].width / 2 + x + xCb(e, g, s)
      cb(e, g, s)
    }
  }
  // bullet cb
  function bulletCb (e, g, s) {
    if (e.ctCollided && e.ctHitOn._.type === 'enemy') {
      if (e.ctHitOn._.hp) {
        e.ctHitOn._.hp -= 1
      }

      destroy(e)
    }
    projectileDestroyCb(e, g, s)
  }

  function spawnBullet (x, y, vx, vy) {
    // spawner
    const e = addEntity()
    addComponent(e, 'pos')
    e.x = x
    e.y = y
    addComponent(e, 'physic')
    e.vx = vx
    e.vy = vy
    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 5
    addComponent(e, 'event')
    e.cb = bulletCb

    addComponent(e, 'collisionTarget')
    e.cType = 'ball'
    e.cRadius = 5
  }

  function spawnPlayer () {
    // player
    const e = g.player = addEntity()

    addComponent(e, 'pos')
    e.x = -9999
    e.y = -9999

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 10

    addComponent(e, 'trackCursor')
    e.trackCursorMaxDistance = 100
    e.x = g.mouseX
    e.y = g.mouseY


    addComponent(e, 'event')
    e._.interval = 20;
    e._.age = 0
    e.cb = (e) => {
      if (e._.age % e._.interval === 0) {
        spawnBullet (e.x, e.y, 0, -500)
        spawnBullet (e.x, e.y, 100, -500)
        spawnBullet (e.x, e.y, -100, -500)
      }
      e._.age++
    }

    addComponent(e, 'collisionSource')
    e.cType = 'ball'
    e.cRadius = 4

    e._.type = 'player'
    e._.immune = false
  }

  function spawnHealthBar () {
    function update (e, g) {
      e.x = g.regions[e.region].width / 2
      e.y = g.regions[e.region].height * 0.1

      const length = g.regions[e.region].width / 3
      const height = 20

      e.bx1 = -length / 2
      e.bx2 = -length / 2 + length * g.boss._.hp / g.boss._.hpMax
      e.by1 = -height / 2
      e.by2 = height / 2
    }

    // hp bar
    const e = g.healthBar = addEntity()

    addComponent(e, 'pos')

    addComponent(e, 'draw')
    e.drawType = 'block'

    addComponent(e, 'event')
    e.cb = update

    update (e, g)
  }

  function spawnHomeScreen (text) {
    {
      //text
      const e = g.homeScreenText = addEntity()
      addComponent(e, 'pos')
      addComponent(e, 'event')

      e.cb = function (e, g) {
        e.x = g.regions[e.region].width / 2
        e.y = g.regions[e.region].height * 0.8
      }

      addComponent(e, 'draw')
      e.drawType = 'text'
      e.text = text
      e.textFont = Math.floor(Math.min(60, g.regions[e.region].width / 15)) + 'px Arial'

      addComponent(e, 'resizeEvent')

      e.resizeCb = (e, g) => {
        e.textFont = Math.floor(Math.min(60, g.regions[e.region].width / 15)) + 'px Arial'
      }
    }

    {
      // click handler
      const e = g.homeScreenText = addEntity()
      addComponent(e, 'pos')
      addComponent(e, 'event')

      addComponent(e, 'trackCursor')

      addComponent(e, 'clickEvent')
      e.clickBx1 = -100
      e.clickBx2 = 100
      e.clickBy1 = -100
      e.clickBy2 = 100
      e.clickCb = (e, g, s) => {
        clear()
        startGame()
      }
    }
  }

  function spawnDirector () {
    const e = g.homeScreenText = addEntity()
    addComponent(e, 'event')

    e._.time = 0

    e.cb = (e, g, s) => {
      e._.time++
      const time = e._.time

      if (time < 60 * 10) {
        // 10 second

        // every .5 second
        if (time % 30 === 0) {
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return Math.cos(
                Math.PI * time / 60 / 2
                + Math.PI * e._.age / 60
              )
                * g.regions[e.region].width / 2.1
            },
            cb: straightBulletCb,
            hp: 2,
            interval: 20
          })
        }
      } else if (time >= 60 * 10 && time < 60 * 20) {
        if (time % 30 === 0) {
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return Math.cos(Math.PI * time / 60 / 2
                              + Math.PI * e._.age / 60) * g.regions[e.region].width / 2.1
            },
            hp: 2,
            cb: swappingBulletCb,
            interval: 20
          })
        }
      } else if (time === 60 * 25) {
        spawnBoss()
        spawnHealthBar ()
      }
    }
  }

  function startGame () {
    spawnDirector ()
    spawnPlayer ()
  }

  function clear () {
    entities.forEach(destroy)
    g.cb = nuzz
  }

  // startGame ()
  spawnHomeScreen ('Click to start')
})
start()
