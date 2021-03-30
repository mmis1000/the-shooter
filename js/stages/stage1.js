/// <reference path="../index.js" />
/// <reference path="./base.js" />

const colors = [
  { r: 1, g: 0, b: 0, a: 0.5 },
  { r: 0.7, g: 0.7, b: 0, a: 0.5 },
  { r: 0, g: 1, b: 0, a: 0.5 },
  { r: 0, g: 0.7, b: 0.7, a: 0.5 },
  { r: 0, g: 0, b: 1, a: 0.5 },
  { r: 0.7, g: 0, b: 0.7, a: 0.5 },
]

let current = 0

const nextColor = () => {
  current = (current + 1) % colors.length

  return colors[current]
}

let stage1
{
  const nextLevelFn = (...args) => stage2(...args);

  stage1 = () => {
    const g = globals

    function spawnDirector() {
      const e = addEntity()
      addComponent(e, 'event')

      e.region = 'stage'

      e.cb = (e, g, s) => {
        const time = e.age

        if (actions[time]) {
          e._.currentCb = actions[time]
        }
        e._.currentCb(e, g, s)

        if (decorations[time]) {
          decorations[time](e, g, s)
        }
      }

      e._.currentCb = () => {}
    }
    spawnDirector()
  }

  const g = globals;
  const b = base

  function spawnHealthBar() {
    const height = 20

    function update(e, g) {
      e.x = g.regions[e.region].width / 2
      e.y = g.regions[e.region].height * 0.1 + height / 2

      const length = g.regions[e.region].width / 3

      e.bx1 = -length / 2

      e.bx2 = -length / 2 + length * Math.max(g.boss.health / g.boss._.hpMax * 2 - 1, 0)
      e.by1 = -height / 4
      e.by2 = height / 4
    }

    function update1(e, g) {
      e.x = g.regions[e.region].width / 2
      e.y = g.regions[e.region].height * 0.1

      const length = g.regions[e.region].width / 3

      e.bx1 = -length / 2

      e.bx2 = -length / 2 + length * Math.max(Math.min(g.boss.health / g.boss._.hpMax * 2, 1), 0)
      e.by1 = -height / 4
      e.by2 = height / 4
    }
    {
      // hp bar rect
      const e = g.healthBar = addEntity()

      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'draw')
      e.drawType = 'block_s'

      e.x = g.regions[e.region].width / 2
      e.y = g.regions[e.region].height * 0.1 + height / 4

      const length = g.regions[e.region].width / 3

      e.bx1 = -length / 2 - 4
      e.bx2 = length / 2 + 4
      e.by1 = -height / 2 - 4
      e.by2 = height / 2 + 4
    }
    {
      // hp bar 1
      const e = g.healthBar = addEntity()

      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'draw')
      e.drawType = 'block'

      addComponent(e, 'event')
      e.cb = update

      update(e, g)
    }
    {
      // hp bar 2
      const e = g.healthBar = addEntity()

      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'draw')
      e.drawType = 'block'

      addComponent(e, 'event')
      e.cb = update1

      update(e, g)
    }
  }

  // Attacks player
  const project = (x, y, arc, distance = 100, base = 100, bulletRadius = 10) => {
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
    e.drawType = 'ball_s'
    e.radius = bulletRadius
    e.draw_g = 0.5
    e.draw_a = 0.7

    addComponent(e, 'event')
    e.cb = b.projectileDestroyCb

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }
  // Attacks player
  const project2 = (x, y, arc, distance = 100, base = 100, bulletRadius = 10, color = { r: 1, g: 1, b: 1, a: 0.5}) =>{
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
    e.draw_r = color.r
    e.draw_g = color.g
    e.draw_b = color.b
    e.draw_a = color.a

    const d = addComponent(e, 'draw')
    d.drawType = 'image_low'
    d.image = 'assets/images/Bullets/P04.png'
    d.bx1 = -6
    d.by1 = -32
    d.bx2 = 6
    d.by2 = 32
    d.draw_rotation = Math.atan2(-e.vy, e.vx) - Math.PI / 2

    addComponent(e, 'event')
    e.cb = b.projectileDestroyCb

    addComponent(e, 'damage')
    e.damage_zone = 'player'
    e.damage = 1

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'
    e.cType = 'ball'
    e.cRadius = bulletRadius
  }

  const straightBulletCb = (e, g, s) => {
    e.y = e.age/ e._.liveSpan * g.regions[e.region].height

    if (e.age< e._.ageWake) {
      return
    }

    if (b.projectileDestroyCb(e, g, s)) return

    if (e.age% e._.interval === 0) {
      const count = 3
      for (let i = 0; i < count; i++) {
        project2(
          e.x + (i - (count - 1) / 2) * 80,
          e.y,
          Math.PI / 2,
          0,
          100,
          e._.bulletRadius,
          e._.color
        )
      }
    }
  }

  const swingBulletCb = (e, g, s) => {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (e.age < e._.ageWake) {
      return
    }

    if (b.projectileDestroyCb(e, g, s)) return

    if (e.age % e._.interval === 0) {
      project2(
        e.x,
        e.y,
        Math.PI / 2 + Math.cos(Math.PI * e.age / e._.interval / 10) * Math.PI / 4,
        0,
        200,
        e._.bulletRadius,
        e._.color
      )
    }
  }

  const swappingBulletCb = (e, g, s) => {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (e.age < e._.ageWake) {
      return
    }

    if (b.projectileDestroyCb(e, g, s)) return

    if (e.age % e._.interval === 0) {
      project2(
        e.x,
        e.y,
        Math.PI / 2,
        0,
        200,
        e._.bulletRadius,
        e._.color
      )
    }
  }

  const noBulletCb = (e, g, s) => {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (b.projectileDestroyCb(e, g, s)) return
  }

  const spawnSmall = ({
    x = 0,
    radius = 20,
    hp = 2,
    interval = 20,
    liveSpan = 60 * 10, // 10 seconds
    cb = straightBulletCb,
    bulletRadius = 5,
    xCb = (e, g, s) => 0,
    color = { r: 1, g: 1, b: 1, a: 0.5}
  } = {
      x: 0,
      radius: 20,
      hp: 2,
      interval: 20,
      liveSpan: 60 * 5,
      cb: straightBulletCb,
      bulletRadius: 5,
      xCb: (e, g, s) => 0,
      color: { r: 1, g: 1, b: 1, a: 0.5}
    }) => {
    const e = addEntity()

    e._.color = color

    addComponent(e, 'pos')
    e.x = g.regions[e.region].width / 2 + x
    e.y = 0
    e.region = 'stage'

    const d = addComponent(e, 'draw')
    d.drawType = 'ball_s'
    d.radius = radius

    const d1 = addComponent(e, 'draw')
    d1.drawType = 'block_s'
    d1.bx1 = -radius / 1.414
    d1.bx2 = radius / 1.414
    d1.by1 = -radius / 1.414
    d1.by2 = radius / 1.414
    d1.draw_r = e._.color.r
    d1.draw_g = e._.color.g
    d1.draw_b = e._.color.b
    d1.draw_a = 1

    const d2 = addComponent(e, 'draw')
    d2.drawType = 'ball_s'
    d2.radius = radius / 2

    const d3 = addComponent(e, 'draw')
    d3.drawType = 'image'
    d3.image = 'assets/images/Ship_02_Player[PLAYER]/AnimIdle/ship02P0000.png'
    d3.draw_rotation = Math.PI / 2 * 3
    d3.bx1 = -32
    d3.by1 = -32
    d3.bx2 = 32
    d3.by2 = 32

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
    e.health_cb = (e, g, s) => {
      g.audioService.playSound('hit')
      if (e.health <= 0) {
        destroy(e)
        g.score._.score += 100

        if (Math.random() < 0.2) {
          base.spawnItem(e.x, e.y, 0, 100)
        }
      }
    }

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

  const spawnBoss = () => {
    // spawner
    const e = g.boss = addEntity()

    addComponent(e, 'pos')
    e.x = g.regions[e.region].width / 2
    e.y = g.regions[e.region].height * 0.4
    e.region = 'stage'

    addComponent(e, 'draw')
    e.drawType = 'ball_s'
    e.radius = 100
    e.draw_r = 0
    e.draw_b = 0
    e.draw_a = 0.9

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
        g.score._.score += 1000;

        destroy(e)

        // g.player._.immune = true

        for (let i = 0; i < 60; i++) {
          var direction = Math.PI * 2 / 60 * i
          project(e.x, e.y, direction)
        }

        const timer = addEntity()
        addComponent(timer, 'event')
        timer.region = 'stage'
        timer.cb = (e, g, s) => {
          if (e.age > 180) {
            destroy(timer)
            b.clear()
            b.spawnHomeScreen('You win, Click to next level', `Score: ${g.score._.score}`, () => {
              const currentScore = g.score._.score

              base.spawnPlayer()
              base.spawnScore(currentScore)
              nextLevelFn()
            })
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
            Math.PI * 2 / count * (i + e.age / (120 + Math.PI)),
            100,
            e.health < 25 ? 150 : 100
          )
        }
      }
    }

  }

  const actions = {
    [60 * 5] (e, g, s) {
      const time = e.age

      // every .5 second
      if (time % 120 === 0) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return -200
          },
          cb: swingBulletCb,
          hp: 3,
          interval: 20
        })
      }

      if (time % 120 === 60) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return 200
          },
          cb: swingBulletCb,
          hp: 3,
          interval: 20
        })
      }

      if (time % 20 === 0) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return Math.cos(Math.PI * e.age / 90) * 75 - 200
          },
          cb: noBulletCb,
          hp: 3,
          interval: 20,
          liveSpan: 180,
          color: nextColor()
        })

        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return 0
          },
          cb: noBulletCb,
          hp: 3,
          interval: 20,
          liveSpan: 180,
          color: nextColor()
        })

        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return Math.cos(Math.PI * e.age / 90) * -75 + 200
          },
          cb: noBulletCb,
          hp: 3,
          interval: 20,
          liveSpan: 180,
          color: nextColor()
        })
      }
    },
    [60 * 15] (e, g, s) {
      const time = e.age

      if (time % 30 === 0) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return Math.cos(Math.PI * time / 60 / 2
              + Math.PI * e.age / 360) * g.regions[e.region].width / 2.1
          },
          hp: 2,
          cb: swappingBulletCb,
          interval: 20,
          color: nextColor()
        })
      }
    },
    [60 * 25] (e, g, s) {},
    [60 * 40] (e, g, s) {
      spawnBoss()
      spawnHealthBar()
    },
    [60 * 40 + 1] (e, g, s) {}
  }

  const decorations = {
    [0] (e, g, c) {
      base.spawnDecoration(
        'assets/images/RandomBuildings/Platform[PLAYER]/P01.png',
        g.regions['stage'].width / 2,
        g.regions['stage'].height * 4 / 5,
        0, 50,
        -64, -64, 64, 64,
        0,
        60
      )
      base.spawnDecoration(
        'assets/images/MiniAsteroids/01.png',
        g.regions['stage'].width / 3 * 2,
        g.regions['stage'].height / 2,
        0, 50,
        -256, -256, 256, 256,
        0,
        60
      )
      base.spawnDecoration(
        'assets/images/RandomBuildings/B01.png',
        64,
        g.regions['stage'].height / 4,
        0, 50,
        -64, -64, 64, 64,
        0,
        60
      )
    }
  }

  let index = 0

  for (let time = 60 * 2; time < 60 * 25; time += 60 * 8) {
    let current = index++
    decorations[time] = (e, g, c) => {
      base.spawnDecorationOnTop(
        `assets/images/MiniAsteroids/0${current % 3 + 1}.png`,
        g.regions['stage'].width / 3 * (current * Math.PI % 2 + 1),
        0, 50,
        -256, -256, 256, 256,
        0,
        60
      )
    }
    decorations[time + 60 * 2] = (e, g, c) => {
      base.spawnDecorationOnTop(
        `assets/images/RandomBuildings/B${(current % 26 + 1).toString().padStart(2, '0')}.png`,
        g.regions['stage'].width / 3 * (current * Math.PI % 2 + 1),
        0, 50,
        -64, -64, 64, 64,
        0,
        60
      )
    }
  }
}
