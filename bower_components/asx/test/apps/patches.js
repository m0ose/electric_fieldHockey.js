// Import the lib/ mmodules via relative paths
import util from 'lib/util.js'
import ColorMap from 'lib/ColorMap.js'
import DataSet from 'lib/DataSet.js'
import Model from 'lib/Model.js'
import Mouse from 'lib/Mouse.js'
window.pps = util.pps

const modules = { ColorMap, Model, util, pps: util.pps }
util.toWindow(modules)
console.log(Object.keys(modules).join(', '))

class PatchModel extends Model {
  setup () {
    this.patches.own('ran ds')
    this.anim.setRate(60)
    this.cmap = ColorMap.Rgb256 // this.cmap = ColorMap.Jet
    this.mouse = new Mouse(this, true).start()
    for (const p of this.patches) {
      p.ran = util.randomFloat(1.0)
      p.ds = 0
    }
  }
  step () {
    if (this.mouse.down) {
      console.log('mouse', this.mouse.x, this.mouse.y)
      const {x, y} = this.mouse
      const p = this.patches.patch(x, y)
      const pRect = patches.patchesInRadius(p, 4)
      for (const n of pRect) n.ran = 1
    }
    this.patches.diffuse('ran', 0.05, this.cmap)
    if (this.anim.ticks === 500) {
      console.log(this.anim.toString())
      this.stop()
    }
  }
}
// const [div, size, max, min] = ['layers', 4, 50, -50]
const [div, size, max, min] = ['layers', 2, 100, -100]
const opts =
  {patchSize: size, minX: 2 * min, maxX: 2 * max, minY: min, maxY: max}
const model = new PatchModel(div, opts).start()

// debugging
const world = model.world
const patches = model.patches
util.toWindow({ model, world, patches, p: patches.oneOf() })
// if (size !== 1) util.addToDom(patches.pixels.ctx.canvas)

// DataSets
const dsetEx = patches.exportDataSet('id', Uint16Array)
console.log('dsetEx 0-99', dsetEx.data.slice(0, 100).toString())
const floatDs = DataSet.emptyDataSet(1000, 2000, Float32Array)
util.repeat(floatDs.data.length, (i, a) => { a[i] = i / 100 }, floatDs.data)

console.log('floatDs 0-99', util.fixedStrings(floatDs.data, 2).slice(0, 100))
patches.importDataSet(floatDs, 'ds')
const dsetIm = patches.exportDataSet('ds')
console.log('dsetIm 0-99', util.fixedStrings(dsetIm.data, 2).slice(0, 100))
util.toWindow({ dsetEx, floatDs, dsetIm })

// const jetColorMap = ColorMap.Jet
// const jetCtx = util.createCtx()
// class JetModel extends Model {
//   setup () {
//
//
//     this.cmap = ColorMap.rgbColorCube(8, 8, 4)
//     for (const p of this.patches) {
//       p.ran = util.randomFloat(1.0)
//     }
//   }
// }
// jetModel = new JetModel({patchSize: 1, minX: 1, maxX: 256, minY: 0, maxY: 0})
