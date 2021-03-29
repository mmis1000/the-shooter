/// <reference path="../index.js" />

const base = (() => {
  const g = globals;

  function projectileDestroyCb(e, g, s) {
    if (e.x < 0 || e.y < 0 || e.x > g.regions[e.region].width || e.y > g.regions[e.region].height) {
      destroy(e)
      return true
    } else {
      return false
    }
  }

  function spawnPlayerBullet(x, y, vx, vy) {
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
    e.draw_r = 0.5
    e.draw_g = 0.5

    const d3 = addComponent(e, 'draw')
    d3.drawType = 'image'
    d3.image = 'assets/images/Bullets/P02.png'
    d3.bx1 = -6
    d3.by1 = -16
    d3.bx2 = 6
    d3.by2 = 16
    d3.draw_rotation = Math.atan2(-vy, vx) - Math.PI / 2

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

    const d = addComponent(e, 'draw')
    d.drawType = 'ball_s'
    d.radius = 10
    d.draw_r = 0.8
    d.draw_g = 0.8
    d.draw_a = 0.2

    const d2 = addComponent(e, 'draw')
    d2.drawType = 'ball_s'
    d2.radius = 5


    const d3 = addComponent(e, 'draw')
    d3.drawType = 'image'
    d3.image = 'assets/images/Ship_01_Player[PLAYER]/AnimIdle/ship01P0000.png'
    d3.bx1 = -16
    d3.by1 = -16
    d3.bx2 = 16
    d3.by2 = 16
    d3.draw_rotation = Math.PI / 2

    addComponent(e, 'collisionSource')
    e.cs_zone = 'player'
    e.cType = 'ball'
    e.cRadius = 4

    if (!/** @type {any} */(window).god) {
      addComponent(e, 'health')
      e.health_zone = 'player'
      e.health = 1
    }

    e.health_cb = (e, g, s) => {
      if (e.health <= 0) {
        clear()
        base.spawnHomeScreen('You dead, try again', undefined, function startGame() {
          base.spawnPlayer()
          base.spawnScore()
          stage1()
        })
      }
    }

    addComponent(e, 'trackCursor')
    e.trackCursorMaxDistance = 1000

    addComponent(e, 'event')
    e._.interval = 20;
    e.cb = (e) => {
      if (e.age % e._.interval === 0) {
        g.audioService.playSound('shoot')
        spawnPlayerBullet(e.x, e.y, 0, -500)
        spawnPlayerBullet(e.x, e.y, 100, -500)
        spawnPlayerBullet(e.x, e.y, -100, -500)
      }
    }
  }

  function spawnItem(x, y, vx, vy) {
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
    e.radius = 10
    e.draw_r = 1
    e.draw_g = 0
    e.draw_b = 0
    e.draw_a = 0.2

    const e1 = addComponent(e, 'draw')
    e1.drawType = 'text'
    e1.draw_r = 1
    e1.draw_g = 1
    e1.draw_b = 1
    e1.draw_a = 1
    e1.text = 'P'
    e1.textFont = '20px Arial'

    addComponent(e, 'event')
    e.cb = (e, g, s) => {
      if (e.ctCollided) {
        e.ctHitOn._.interval = 5
        g.player.cb = (e) => {
          if (e.age % e._.interval === 0) {
            g.audioService.playSound('shoot')
            switch ((e.age / e._.interval) % 4) {
              case 0:
                spawnPlayerBullet(e.x, e.y, 0, -500)
                spawnPlayerBullet(e.x, e.y, 0, -500)
                break
              case 1:
                spawnPlayerBullet(e.x + 5, e.y, 50, -500)
                spawnPlayerBullet(e.x - 5, e.y, -50, -500)
                break
              case 2:
                spawnPlayerBullet(e.x + 5, e.y, 100, -500)
                spawnPlayerBullet(e.x - 5, e.y, -100, -500)
                break
              case 3:
                spawnPlayerBullet(e.x + 5, e.y, 50, -500)
                spawnPlayerBullet(e.x - 5, e.y, -50, -500)
                break
            }
          }
        }
        destroy(e)
      }
      projectileDestroyCb(e, g, s)
    }

    addComponent(e, 'collisionTarget')
    e.ct_zone = 'player'
    e.cType = 'ball'
    e.cRadius = 5
  }

  function spawnScore(currentScore = 0) {
    const e = g.score = addEntity()
    e._.score = currentScore

    addComponent(e, 'pos')
    e.region = 'stage'

    addComponent(e, 'event')
    e.cb = (e, g, s) => {
      e.x = g.regions[e.region].width - 100
      e.y = 40
      e.text = String(e._.score)
    }

    addComponent(e, 'draw')
    e.drawType = 'text'
    e.text = ''
    e.textFont = Math.floor(Math.min(60, g.regions[e.region].width / 15)) + 'px Arial'
  }

  function spawnHomeScreen(text, text2, startHandler) {
    g.audioService.playSoundLoop(null)
    exitTouchMouseMode(g);

    {
      //text
      const e = g.homeScreenText = addEntity()
      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'event')
      e.cb = (e, g, s) => {
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

    if (text2 !== undefined) {
      //text
      const e = addEntity()
      addComponent(e, 'pos')
      e.region = 'stage'

      addComponent(e, 'event')
      e.cb = (e, g, s) => {
        e.x = g.regions[e.region].width / 2
        e.y = g.regions[e.region].height * 0.8 + 100
      }

      addComponent(e, 'draw')
      e.drawType = 'text'
      e.text = text2
      e.textFont = Math.floor(Math.min(60, g.regions[e.region].width / 15)) + 'px Arial'
      e.draw_a = 0.4

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
      e.clickCb = async (e, g, s) => {
        await g.audioService.resume()
        g.audioService.playSoundLoop('battle-theme')

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
        startHandler()
      }
    }
  }

  function clear() {
    entities.forEach((e) => e.region === 'stage' && destroy(e))
    g.cb = nuzz
  }

  return {
    spawnPlayer,
    spawnItem,
    spawnHomeScreen,
    spawnScore,
    projectileDestroyCb,
    clear
  }
})()
