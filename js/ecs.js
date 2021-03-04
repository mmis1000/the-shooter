const dropPerPixel = 0.001
const speedRatio = 1
const tailLength = 150
const msaa = 1
const maxTickLength = 0.02
//----
const componentLists = new Map()
const entities = new Set()
const globals = {}

const nuzz = () => {}

const components = {
}

function addEntity () {
  const e = {
    age: 0,
    destroyed: false
  }

  e.meta = e._ = {}

  entities.add(e)

  return e
}

function addComponent (e, name) {
  components[name](e)
  componentLists.set(name, componentLists.get(name) || new Set())
  componentLists.get(name).add(e)
}

function hasComponent (e, name) {
  return componentLists.has(name) && componentLists.get(name).has(e)
}

function destroy(e) {
  e.destroyed = true
}

function gc () {
  for (let e of entities) {
    if (e.destroyed) {
      entities.delete(e)

      for (let list of componentLists.values()) {
        list.delete(e)
      }
    }
  }
}

function getByComponent (name) {
  return componentLists.get(name) || new Set()
}

const systems = [

]

// ticker

let prev = null

function tick (ms) {
  if (prev == null) {
    prev = ms / 1000 - 0.016
  }

  const diff = Math.min(ms / 1000 - prev, maxTickLength) * speedRatio

  prev = ms / 1000

  for (let sys of systems) {
    if (sys.tick) {
      sys.tick(diff, globals)
    }
  }

  gc()

  for (let e of entities) {
    e.age++;
  }

  requestAnimationFrame(tick)
}
// setup

function setup(setupCb = (g) => {}) {
  setupCb(globals)
}

// boot

function init () {
  for (let sys of systems) {
    if (sys.init) {
      sys.init(globals)
    }
  }
}

// run

function start () {
  requestAnimationFrame(tick)
}
