// Import the lib/ mmodules via relative paths
import util from 'lib/util.js'
import Color from 'lib/Color.js'
import ColorMap from 'lib/ColorMap.js'
import Model from 'lib/Model.js'

const modules = { ColorMap, Color, Model, util }
util.toWindow(modules)
console.log(Object.keys(modules).join(', '))

class ConeModel extends Model {
  setup () {
    const population = 25
    const cmap = ColorMap.Rgb256

    this.velocity = 0.5
    this.radius = 10
    this.width = util.radians(135)
    this.useInRadius = false
    this.useOther = true
    // this.backgroundColor = cmap.closestColor(200, 200, 200)
    this.backgroundColor = Color.toTypedColor('lightgray')
    this.turtleColor = Color.toTypedColor('black')

    this.anim.setRate(60)

    this.turtles = this.patches.nOf(population)
    this.coneColors =
      util.repeat(population, (i, a) => { a[i] = cmap.randomColor() }, [])
    this.headings =
      util.repeat(population, (i, a) => { a[i] = util.randomInt(360) }, [])
  }
  step () {
    const {radius, width, patches, headings, turtles} = this
    patches.forEach((p) => { p.color = this.backgroundColor })
    turtles.forEach((t, i) => {
      const heading = headings[i]
      const pset = this.useInRadius
        ? patches.inRadius(t, radius)
        : patches.inCone(t, radius, width, util.angle(headings[i]))
      pset.forEach((p) => { p.color = this.coneColors[i] })
      t.color = this.turtleColor

      let tnext = patches.patchAtHeadingAndDistance(t, heading, 1.415)
      let hnext = heading
      if (!tnext) {
        tnext = t.neighbors.oneOf()
        hnext += 180
      }
      // turtles[i] = t.neighbors.oneOf()
      // headings[i] += util.randomCentered(45)
      turtles[i] = tnext
      headings[i] = hnext
    })
  }
}
// const [div, size, max, min] = ['layers', 2, 100, -100]
const [div, size, max, min] = ['layers', 4, 50, -50]
const opts =
  {patchSize: size, minX: min, maxX: max, minY: min, maxY: max}
const model = new ConeModel(div, opts).start()
// const model = new ConeModel('layers').start()

// debugging
const world = model.world
const patches = model.patches
util.toWindow({ model, world, patches, p: patches.oneOf() })
// if (size !== 1) util.addToDom(patches.pixels.ctx.canvas)
