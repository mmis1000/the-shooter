/// <reference path="../index.js" />
/// <reference path="./base.js" />
// @ts-check
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

        if (actions_1[time]) {
          e._.currentCb = actions_1[time]
        }
        e._.currentCb(e, g, s)
      }

      e._.currentCb = actions_1[0]
    }
    spawnDirector()
  }

  const g = globals;
  const b = base

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
    e.drawType = 'ball'
    e.radius = bulletRadius

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
  const project2 = (x, y, arc, distance = 100, base = 100, bulletRadius = 10) =>{
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
          e._.bulletRadius
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
      const count = 3
      for (let i = 0; i < count; i++) {
        project2(
          e.x,
          e.y,
          Math.PI / 2 + Math.cos(Math.PI * e.age / e._.interval / 10) * Math.PI / 4,
          0,
          200,
          e._.bulletRadius
        )
      }
    }
  }

  const swappingBulletCb = (e, g, s) => {
    e.y = e.age / e._.liveSpan * g.regions[e.region].height

    if (e.age < e._.ageWake) {
      return
    }

    if (b.projectileDestroyCb(e, g, s)) return

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
    }) => {
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
    e.health_cb = (e, g, s) => {
      if (e.health <= 0) {
        destroy(e)
        g.score._.score += 100
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
        g.score._.score += 1000;

        destroy(e)

        // g.player._.immune = true

        for (let i = 0; i < 60; i++) {
          var direction = Math.PI * 2 / 60 * i
          project(e.x, e.y, direction)
        }

        const timer = addEntity()
        addComponent(timer, 'event')
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
            Math.PI * 2 / count * (i + e.health / (120 + Math.PI)),
            100,
            e.health < 25 ? 150 : 100
          )
        }
      }
    }

  }

  const actions_1 = {
    [0] (e, g, s) {
      const time = e.age

      // every .5 second
      if (time % 60 === 0) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return -200
          },
          cb: swingBulletCb,
          hp: 3,
          interval: 20
        })
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

      if (time % 120 === 0) {
        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return Math.cos(Math.PI * e.age / 30) * 75 - 200
          },
          cb: noBulletCb,
          hp: 4,
          interval: 20,
          liveSpan: 60
        })

        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return 0
          },
          cb: noBulletCb,
          hp: 4,
          interval: 20,
          liveSpan: 60
        })

        spawnSmall({
          x: 0,
          xCb(e, g, s) {
            return Math.cos(Math.PI * e.age / 30) * -75 + 200
          },
          cb: noBulletCb,
          hp: 4,
          interval: 20,
          liveSpan: 60
        })
      }
    },
    [60 * 10] (e, g, s) {
      const time = e.age

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
    },
    [60 * 20] (e, g, s) {
    },
    [60 * 25] (e, g, s) {
      spawnBoss()
      b.spawnHealthBar()
    },
    [60 * 25 + 1] (e, g, s) {}
  }
}
