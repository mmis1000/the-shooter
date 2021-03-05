/// <reference path="./ecs.js" />
/// <reference path="./system_trackCursor.js" />
/// <reference path="./system_regions.js" />
/// <reference path="./stages/stage1.js" />
/// <reference path="./stages/base.js" />
// @ts-check
init()

setup((g) => {
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

  function startGame() {
    base.spawnPlayer()
    base.spawnScore()
    stage1()
  }

  base.spawnHomeScreen('Click to start', undefined, startGame)
})

start()
