// @ts-check
init()

setup((g) => {
  const regionWindow = g.regions['window']
  const regionStage = g.regions['stage_dec'] = g.regions['stage'] = {
    left: 0,
    top: 0,
    width: 720,
    height: 960,
    scale: 1
  }

  g.mouseRegions['stage_dec'] = g.mouseRegions['stage'] = {
    x: 0,
    y: 0,
    clickDOwn: false
  }

  const updateSize = () => {
    const regionWindow = g.regions['window']

    if (
      regionStage.height / regionStage.width
      > regionWindow.height / regionWindow.width
    ) {
      // game is taller
      const scale = regionWindow.height / regionStage.height
      regionStage.scale = scale
      regionStage.top = 0;
      regionStage.left = regionWindow.width / 2 - (regionStage.width * scale) / 2
    } else {
      // game is taller
      const scale = regionWindow.width / regionStage.width
      regionStage.scale = scale
      regionStage.left = 0;
      regionStage.top = regionWindow.height / 2 - (regionStage.height * scale) / 2
    }
  }

  updateSize()

  g.resizeCb = updateSize

  function projectileDestroyCb(e, g, s) {
    if (e.x < 0 || e.y < 0 || e.x > g.regions[e.region].width || e.y > g.regions[e.region].height) {
      destroy(e)
      return true
    } else {
      return false
    }
  }

  // Attacks player
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
    e.region = 'stage'
    addComponent(e, 'physic')
    e.vx = vector.x * base
    e.vy = vector.y * base
    e.ax = vector.x * acc
    e.ay = vector.y * acc

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = bulletRadius

    addComponent(e, 'event')
    e.cb = projectileDestroyCb

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }

  function spawnBoss() {
    // spawner
    const e = g.boss = addEntity()

    addComponent(e, 'pos')
    e.x = g.regions[e.region].width / 2
    e.y = g.regions[e.region].height * 0.4
    e.region = 'stage'

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 100

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'

    addComponent(e, 'collisionSource')
    e.cs_zone = 'enemy'
    e.cType = 'ball'
    e.cRadius = 100

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'health')
    e.health_zone = 'enemy'
    e._.hpMax = e.health = 50

    e.health_cb = (e, g, s) => {
      if (e.health <= 0) {
        destroy(e)
        destroy(g.healthBar)

        // g.player._.immune = true

        for (let i = 0; i < 60; i++) {
          var direction = Math.PI * 2 / 60 * i
          project(e.x, e.y, direction)
        }

        g.countDown = 180
        g.cb = (g, s) => {
          g.countDown--
          if (g.countDown < 0) {
            clear()
            spawnHomeScreen('You win, Click to start again')
          }
        }
      }
    }

    addComponent(e, 'event')
    e._.interval = 10
    e._.ageWake = 40

    e.cb = (e, g, s) => {
      e.radius = 100 + (Math.cos((e.age/ 10) * Math.PI * 2) + 1) * 5

      e.x = g.regions[e.region].width / 2 + Math.sin(e.age / 20) * 100
      e.y = g.regions[e.region].height * 0.4 + Math.cos(e.age / 20) * 100

      if (e.age < e._.ageWake) {
        return
      }

      if (e.age % e._.interval === 0) {
        const count = e.health < 25 ? 12 : 8
        for (let i = 0; i < count; i++) {
          project(
            e.x,
            e.y,
            Math.PI * 2 / count * (i + e.health / (120 + Math.PI)),
            100,
            e.health < 25 ? 150 : 100
          )
        }
      }
    }

  }

  // Attacks player
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
    e.region = 'stage'

    addComponent(e, 'physic')
    e.vx = vector.x * base
    e.vy = vector.y * base
    e.ax = vector.x * acc
    e.ay = vector.y * acc

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = bulletRadius

    addComponent(e, 'event')
    e.cb = projectileDestroyCb

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }

  function straightBulletCb(e, g, s) {
    e.y = e.age/ e._.liveSpan * g.regions[e.region].height

    if (e.age< e._.ageWake) {
      return
    }

    if (projectileDestroyCb(e, g, s)) return

    if (e.age% e._.interval === 0) {
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
  }

  function swingBulletCb(e, g, s) {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (e.age < e._.ageWake) {
      return
    }

    if (projectileDestroyCb(e, g, s)) return

    if (e.age % e._.interval === 0) {
      const count = 3
      for (let i = 0; i < count; i++) {
        project2(
          e.x,
          e.y,
          Math.PI / 2 + Math.cos(Math.PI * e.age / e._.interval / 10) * Math.PI / 5,
          0,
          200,
          e._.bulletRadius
        )
      }
    }
  }

  function noBulletCb(e, g, s) {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (projectileDestroyCb(e, g, s)) return
  }

  function swappingBulletCb(e, g, s) {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (e.age < e._.ageWake) {
      return
    }

    if (projectileDestroyCb(e, g, s)) return

    if (e.age % e._.interval === 0) {
      const count = 3
      for (let i = 0; i < count; i++) {
        project2(
          e.x + (i - (count - 1) / 2) * 80,
          e.y,
          Math.PI / 2 + Math.cos(Math.PI * e.age / e._.interval) * Math.PI / 10,
          0,
          100,
          e._.bulletRadius
        )
      }
    }
  }

  function spawnSmall({
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
    e.region = 'stage'

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = radius

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'collisionSource')
    e.cs_zone = 'enemy'
    e.cType = 'ball'
    e.cRadius = 20

    addComponent(e, 'health')
    e.health_zone = 'enemy'
    e.health = hp

    addComponent(e, 'event')
    e._.interval = interval
    e._.ageWake = 0
    e._.liveSpan = liveSpan
    e._.bulletRadius = bulletRadius

    e.cb = function (e, g, s) {
      e.x = g.regions[e.region].width / 2 + x + xCb(e, g, s)
      cb(e, g, s)
    }
  }

  function spawnPlayerBullet(x, y, vx, vy) {
    // spawner
    const e = addEntity()
    addComponent(e, 'pos')
    e.x = x
    e.y = y
    e.region = 'stage'
    addComponent(e, 'physic')
    e.vx = vx
    e.vy = vy

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 5

    addComponent(e, 'event')
    e.cb = projectileDestroyCb

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'enemy'
    e.cType = 'ball'
    e.cRadius = 5

    addComponent(e, 'damage')
    e.damage_zone = 'enemy'
    e.damage = 1
    e.damage_cb = destroy
  }

  function spawnPlayer() {
    // player
    const e = g.player = addEntity()

    addComponent(e, 'pos')
    e.region = 'stage'
    e.x = g.regions['stage'].width / 2
    e.y = g.regions['stage'].height * 4 / 5

    addComponent(e, 'draw')
    e.drawType = 'ball'
    e.radius = 10


    addComponent(e, 'collisionSource')
    e.cs_zone = 'player'
    e.cType = 'ball'
    e.cRadius = 4

    addComponent(e, 'health')
    e.health_zone = 'player'
    e.health = 1

    e.health_cb = (e, g, s) => {
      if (e.health <= 0) {
        clear()
        spawnHomeScreen('You dead, try again')
      }
    }

    addComponent(e, 'trackCursor')
    e.trackCursorMaxDistance = 100

    addComponent(e, 'event')
    e._.interval = 20;
    e.cb = (e) => {
      if (e.age % e._.interval === 0) {
        spawnPlayerBullet(e.x, e.y, 0, -500)
        spawnPlayerBullet(e.x, e.y, 100, -500)
        spawnPlayerBullet(e.x, e.y, -100, -500)
      }
    }
  }

  function spawnHealthBar() {
    function update(e, g) {
      e.x = g.regions[e.region].width / 2
      e.y = g.regions[e.region].height * 0.1

      const length = g.regions[e.region].width / 3
      const height = 20

      e.bx1 = -length / 2

      e.bx2 = -length / 2 + length * g.boss.health / g.boss._.hpMax
      e.by1 = -height / 2
      e.by2 = height / 2
    }

    // hp bar
    const e = g.healthBar = addEntity()

    addComponent(e, 'pos')
    e.region = 'stage'

    addComponent(e, 'draw')
    e.drawType = 'block'

    addComponent(e, 'event')
    e.cb = update

    update(e, g)
  }

  function spawnHomeScreen(text) {
    exitTouchMouseMode(g);

    {
      //text
      const e = g.homeScreenText = addEntity()
      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'event')
      e.cb= (e, g, s) => {
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
      e.region = 'stage'

      addComponent(e, 'event')

      addComponent(e, 'trackCursor')

      addComponent(e, 'clickEvent')
      e.clickBx1 = -100
      e.clickBx2 = 100
      e.clickBy1 = -100
      e.clickBy2 = 100
      e.clickCb = (e, g, s) => {
        const { x, y } = localToGlobal(
          g.regions['stage'].width / 2, g.regions['stage'].height * 4 / 5,
          g.regions['stage'].top, g.regions['stage'].left,
          g.regions['stage'].scale
        )
        startTouchMouseMode(
          g,
          x,
          y
        )
        clear()
        startGame()
      }
    }
  }

  function spawnDirector() {
    const e = g.homeScreenText = addEntity()
    addComponent(e, 'event')

    e.region = 'stage'

    e._.time = 0

    e.cb = (e, g, s) => {
      e._.time++
      const time = e._.time

      if (time < 60 * 10) {
        // 10 second

        // every .5 second
        if (time % 60 === 0) {
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return -200
            },
            cb: swingBulletCb,
            hp: 2,
            interval: 20
          })
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return 200
            },
            cb: swingBulletCb,
            hp: 2,
            interval: 20
          })
        }

        if (time % 120 === 0) {
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return -75
            },
            cb: noBulletCb,
            hp: 4,
            interval: 20,
            liveSpan: 60
          })

          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return 75
            },
            cb: noBulletCb,
            hp: 4,
            interval: 20,
            liveSpan: 60
          })
        }
      } else if (time >= 60 * 10 && time < 60 * 20) {
        if (time % 30 === 0) {
          spawnSmall({
            x: 0,
            xCb(e, g, s) {
              return Math.cos(Math.PI * time / 60 / 2
                + Math.PI * e.age / 60) * g.regions[e.region].width / 2.1
            },
            hp: 2,
            cb: swappingBulletCb,
            interval: 20
          })
        }
      } else if (time === 60 * 25) {
        spawnBoss()
        spawnHealthBar()
      }
    }
  }

  function startGame() {
    spawnDirector()
    spawnPlayer()
  }

  function clear() {
    entities.forEach((e) => e.region === 'stage' && destroy(e))
    g.cb = nuzz
  }

  // startGame ()
  spawnHomeScreen('Click to start')

  {
    // border
    const e = addEntity()

    addComponent(e, 'pos')
    e.region = 'stage_dec'

    addComponent(e, 'draw')
    e.drawType = 'block_s'

    e.bx1 = 0
    e.bx2 = g.regions['stage_dec'].width
    e.by1 = 0
    e.by2 = g.regions['stage_dec'].height
  }
})

start()
