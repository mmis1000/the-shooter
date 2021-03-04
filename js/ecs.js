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

const tps = 60
const diff = 1 / tps
let prev = Date.now()
const minNext = 1 / tps / 5

function tick () {
  const untilNext = Math.max((prev + diff) - Date.now(), minNext)
  prev = Date.now();

  globals.prevUpdate = prev

  for (let sys of systems) {
    if (sys.tick) {
      sys.tick(diff, globals)
    }
  }

  gc()

  for (let e of entities) {
    e.age++;
  }

  setTimeout(tick, untilNext)
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
  prev = Date.now() - diff
  tick()
}
