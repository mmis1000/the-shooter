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

let id = 0;

function addEntity () {
  const e = {
    id: id++,
    age: 0,
    destroyed: false
  }

  e.meta = e._ = {}

  entities.add(e)

  return e
}

function addComponent (e, name) {
  const res = components[name](e)
  componentLists.set(name, componentLists.get(name) || new Set())
  componentLists.get(name).add(e)
  return res
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
const diff = 1000 / tps
let prev = Date.now()
const minNext = 4

function tick () {
  const untilNext = Math.max((prev + diff) - Date.now(), minNext)
  prev = Date.now();

  globals.prevUpdate = prev

  for (let sys of systems) {
    if (sys.tick) {
      sys.tick(diff / 1000, globals)
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

const pendingJobs = []

function init () {
  for (let sys of systems) {
    if (sys.init) {
      const res = sys.init(globals)
    }
    if (sys.asyncInit) {
      pendingJobs.push(sys.asyncInit(globals))
    }
  }
}

// run

async function start () {
  await Promise.all(pendingJobs)
  prev = Date.now() - diff
  tick()
}
