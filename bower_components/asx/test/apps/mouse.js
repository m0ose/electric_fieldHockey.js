// Import the lib/ mmodules via relative paths
import util from 'lib/util.js'
import Model from 'lib/Model.js'
import Mouse from 'lib/Mouse.js'
import ColorMap from 'lib/ColorMap.js'

const modules = { Mouse, Model, util }
util.toWindow(modules)
console.log('modules:', Object.keys(modules).join(', '))

class MouseTest extends Model {
  setup () {
    for (const p of this.patches) {
      p.mycolor = 0
    }
    this.cmap = ColorMap.Jet
    // initialize the mouse
    this.mouse = new Mouse(this, true, (evt) => {
      let [x,y] = [Math.round(evt.x), Math.round(evt.y)] // this causes problems if it is a float.
      let p = model.patches.patchXY(x, y)
      p.mycolor = Math.random()
      this.once() // draw patches
    })
    this.mouse.start()
  }

  step () {
    for (const p of this.patches) {
      p.setColor(this.cmap.scaleColor(p.mycolor, 0, 1))
    }
  }
}
const model = new MouseTest('layers', {
  patchSize: 2,
  minX: -100,
  maxX: 114,
  minY: -117,
  maxY: 127
}) // don't start, mouse driven instead
model.once()
util.toWindow({model, mouse: model.mouse})
