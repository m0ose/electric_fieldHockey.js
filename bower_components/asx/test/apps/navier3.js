// Import the lib/ mmodules via relative paths
import ColorMap from 'lib/ColorMap.js'
import Model from 'lib/Model.js'
import util from 'lib/util.js'
import DataSet from 'lib/DataSet.js'
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r82/three.min.js'
window.pps = util.pps

const modules = { ColorMap, Model, util, pps: util.pps }
util.toWindow(modules)
console.log(Object.keys(modules).join(', '))

function initThree (canvas) {
  const renderer = new THREE.WebGLRenderer()
  const [width, height] = [window.innerWidth, window.innerHeight]
  renderer.setSize(width, height)

  document.body.appendChild(renderer.domElement)
  // document.body.appendChild(canvas)

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000)
  camera.position.z = 600

  const texture = new THREE.Texture(canvas)
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter

  const geometry = new THREE.PlaneGeometry(canvas.width, canvas.height, 1, 1)
  const material = new THREE.MeshBasicMaterial({
    map: texture, side: THREE.DoubleSide
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  return {scene, camera, renderer, texture, geometry, material, mesh}
}
class PatchModel extends Model {
  constructor (div, worldOptions = {}, contextOptions = {}) {
    super(div, worldOptions, contextOptions)
    this.div.hidden = true
    this.threeObj = initThree(this.contexts.patches.canvas)
  }
  setup () {
    this.BOUNDS_TYPES = {DENSITY: 'DENSITY', 'V': 'V', 'U': 'U'}
    util.error = console.warn
    this.anim.setRate(60)
    this.cmap = ColorMap.Jet
    this.dt = 1
    this.solverIterations = 12
    this.boundaryElasticity = 1
    this.windHeading = Math.PI / 2
    this.dens = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.dens_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.u = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.v = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.u_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.v_prev = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    this.P = DataSet.emptyDataSet(this.u.width, this.u.height, Float32Array)
    this.DIV = DataSet.emptyDataSet(this.u.width, this.u.height, Float32Array)
    this.boundaries = DataSet.emptyDataSet(this.world.numX, this.world.numY, Float32Array)
    for (const p of this.patches) {
      p.dens = 0
    }
    //
    //
    this.makeFakeBoundaries()
    //
    // for testing mouse
    // var la = document.getElementById('layers')
    var la = document.body
    la.getBoundingClientRect()
    la.onclick = (ev) => {
      var bnd = la.getBoundingClientRect(la)
      var dx = ev.x - bnd.width / 2 - bnd.left
      var dy = ev.y - bnd.height / 2 - bnd.top
      this.windHeading = Math.atan2(dy, dx)
    }
  }

  makeFakeBoundaries () {
    const W = this.world
    for (const p of this.patches) {
      const y = Math.cos(p.x / 9) * 34 + 21 + Math.sin(p.x) * 4
      const diff = p.y - y
      if (diff > 0 && diff < 20) this.boundaries.setXY(p.x - W.minX, W.maxY - p.y, 1.0)
      if (p.x <= W.minX || p.x >= W.maxX || p.y <= W.minY || p.y >= W.maxY) {
        this.boundaries.setXY(p.x - W.minX, W.maxY - p.y, 1.0)
      }
    }
  }

  indx (x, y) {
    return Math.floor(x) + Math.floor(y) * this.u.width
  }

  getXY (ds, x, y) {
    return ds.data[Math.floor(x) + Math.floor(y) * this.u.width]
  }

  // do this is order to draw them.
  putDataSetOnPatches (ds) {
    const W = this.world
    let p
    for (var i = 0; i < this.patches.length; i++) {
      p = this.patches[i]
      p.dens = ds.getXY(p.x - W.minX, W.maxY - p.y)
      if (this.boundaries.getXY(p.x - W.minX, W.maxY - p.y) > 0.0) p.dens = 4
    }
  }

  patchXY2DataSetXY (pat) {
    return {x: pat.x - this.world.minX, y: this.world.maxY - pat.y}
  }

  step () {
    //
    this.addForces()
    this.addDensity()
    this.velocityStep()
    this.densityStep()
    setTimeout(this.drawStep.bind(this), 1)
  }

  drawStep () {
    this.putDataSetOnPatches(this.dens)
    for (const p of this.patches) {
      p.setColor(this.cmap.scaleColor(p.dens, 0, 1))
    }
    // this.patches.diffuse4('ran', 0.1, this.cmap)
    if (this.anim.ticks % 30 === 0) {
      console.log(this.anim.toString())
    }
    if (this.anim.ticks === 600) {
      this.stop()
    }
  }

  // overload the agent script draw function. This is probably not the correct way
  // Owen, how should this be done?
  draw (force = this.anim.stopped || this.anim.draws === 1) {
    if (this.div) {
      if (force || this.refreshPatches) this.patches.draw(this.contexts.patches)
    }
    // vector
    const ctx = this.contexts.patches
    ctx.beginPath()
    for (const p of this.patches) {
      if (p.x % 5 === 0 && p.y % 5 === 0) {
        var xy = this.patchXY2DataSetXY(p)
        const u = this.getXY(this.u, xy.x, xy.y) // this.u.getXY(xy.x, xy.y)
        const v = this.getXY(this.v, xy.x, xy.y) // this.v.getXY(xy.x, xy.y)
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + u, p.y - v)
      }
    }
    ctx.stroke()
    ctx.closePath()

    const {renderer, scene, camera, texture, mesh} = this.threeObj
    texture.needsUpdate = true
    mesh.rotation.x += 0.01
    // mesh.rotation.y += 0.01
    renderer.render(scene, camera)
  }

  addDensity () {

  }

  addForces () {
    var w = this.world.maxX - this.world.minX
    var h = this.world.maxY - this.world.minY
    for (let i = 0; i <= 6; i += 2) {
      for (let j = 0; j <= 6; j += 2) {
        this.dens.setXY(w / 2 + i, h / 2 + j, 1)
        this.u.setXY(w / 2 + i, h / 2 + j, 10 * Math.cos(this.windHeading))
        this.v.setXY(w / 2 + i, h / 2 + j, 10 * Math.sin(this.windHeading))
      }
    }
  }

  densityStep () {
    this.addSource(this.dens, this.dens_prev)
    this.swapDensity()
    // this.diffusionStamMethod(this.dens_prev, this.dens)
    this.dens = this.dens_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.swapDensity()
    this.advect(this.dens_prev, this.dens)
  }

  velocityStep () {
    this.addSource(this.u, this.u_prev)
    this.addSource(this.v, this.v_prev)
    this.swap('u', 'u_prev')
    // this.u = this.u_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.u_prev, this.u)
    this.swap('v', 'v_prev')
    // this.v = this.v_prev.convolve([0, 1, 0, 1, 2, 1, 0, 1, 0], 1 / 6 * this.dt)
    this.diffusionStamMethod(this.v_prev, this.v)
    this.project()
    this.swap('u', 'u_prev')
    this.swap('v', 'v_prev')
    this.advect(this.u_prev, this.u)
    this.advect(this.v_prev, this.v)
    this.project()
  }

  setBoundary (ds, type) {
    const B = this.boundaries
    if (type === this.BOUNDS_TYPES.V) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          const me = this.getXY(B, i, j) // this.boundaries.getXY(i,j)
          const up = this.getXY(B, i, j + 1) // this.boundaries.getXY(i,j+1)
          const dn = this.getXY(B, i, j - 1) // this.boundaries.getXY(i,j-1)
          if (up > 0.0 || dn > 0.0) {
            ds.setXY(i, j, -this.boundaryElasticity * ds.getXY(i, j))
          }
          if (me > 0.0) {
            ds.setXY(i, j, 0)
          }
        }
      }
    } else if (type === this.BOUNDS_TYPES.U) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          const me = this.getXY(B, i, j)
          const lf = this.getXY(B, i - 1, j) // this.boundaries.getXY(i-1,j)
          const rt = this.getXY(B, i + 1, j) // this.boundaries.getXY(i+1,j)
          if (lf > 0.0 || rt > 0.0) {
            ds.setXY(i, j, -this.boundaryElasticity * ds.getXY(i, j))
          }
          if (me > 0.0) {
            ds.setXY(i, j, 0)
          }
        }
      }
    } else if (type === this.BOUNDS_TYPES.DENSITY) {
      for (let i = 0; i < ds.width; i++) {
        for (let j = 0; j < ds.height; j++) {
          var isb = (this.getXY(B, i, j) > 0)
          if (isb) ds.setXY(i, j, 0)
        }
      }
    }
  }

  addSource (x0, x) {
    for (var i = 0; i < x0.data.length; i++) {
      x.data[i] += x0.data[i] * this.dt
    }
  }

  swapDensity () {
    this.swap('dens', 'dens_prev')
  }

  swap (key1, key2) {
    const tmp = this[key1]
    this[key1] = this[key2]
    this[key2] = tmp
  }

  advect (X0, X) {
    for (var i = 0; i < X.width; i++) {
      for (var j = 0; j < X.height; j++) {
        var dudt = this.getXY(this.u, i, j) * (-this.dt) // this.u.getXY(i, j) * (-this.dt)
        var dvdt = this.getXY(this.v, i, j) * (-this.dt) // this.v.getXY(i, j) * (-this.dt)
        var x2 = dudt + i
        var y2 = dvdt + j
        if (X.inBounds(x2, y2)) {
          var val = X0.bilinear(x2, y2)
          if (this.getXY(this.boundaries, i, j) !== 0.0) {
            X.data[this.indx(x2, y2)] = val
          } else {
            X.data[this.indx(i, j)] = val
          }
          // X.setXY(i, j, val)
        } else {
          X.setXY(i, j, 0)
        }
      }
    }
  }

  project () {
    this.projectStep1()
    this.projectStep2()
    this.projectStep3()
  }

  projectStep1 () {
    var p = this.P
    var div = this.DIV
    var U = this.u
    var V = this.v
    var h = -0.5 * Math.hypot(U.width, U.height)
    for (var i = 0; i < U.width; i++) {
      for (var j = 0; j < U.height; j++) {
        var gradX = U.data[this.indx(i + 1, j)] - U.data[this.indx(i - 1, j)]
        var gradY = V.data[this.indx(i, j + 1)] - V.data[this.indx(i, j - 1)]
        div.setXY(i, j, h * (gradX + gradY))
      }
    }
    for (i = 0; i < p.data.length; i++) p.data[i] = 0
    this.setBoundary(div, this.BOUNDS_TYPES.V)
    this.setBoundary(p, this.BOUNDS_TYPES.U)
  }

  projectStep2 () {
    var p = this.P
    var div = this.DIV
    //
    for (var k = 0; k < this.solverIterations; k++) {
      for (var i = 1; i < p.width - 1; i++) {
        for (var j = 1; j < p.height - 1; j++) {
          var indx = this.indx(i, j)
          var val = div.data[indx]
          val = val + p.data[indx + 1] + p.data[indx - 1]
          val = val + p.data[indx - p.width] + p.data[indx + p.width]
          // var val = div.getXY(i, j) + p.getXY(i - 1, j) + p.getXY(i + 1, j) + p.getXY(i, j - 1) + p.getXY(i, j + 1)
          val = val / 4
          p.data[indx] = val
        }
      }
    }
    this.setBoundary(p, this.BOUNDS_TYPES.U)
    this.setBoundary(div, this.BOUNDS_TYPES.V)
  }

  projectStep3 () {
    var p = this.P
    var U = this.u
    var V = this.v
    var pdx, pdy, v1, v2
    var wScale = 0.5 / U.width
    var hScale = 0.5 / U.height
    for (var i = 1; i < U.width - 1; i++) {
      for (var j = 1; j < U.height - 1; j++) {
        var indx = this.indx(i, j)
        pdx = p.data[this.indx(i + 1, j)] - p.data[this.indx(i - 1, j)]
        pdy = p.data[this.indx(i, j + 1)] - p.data[this.indx(i, j - 1)]
        v1 = U.data[this.indx(i, j)] - wScale * pdx
        v2 = V.data[this.indx(i, j)] - hScale * pdy
        U.data[indx] = v1
        V.data[indx] = v2
      }
    }
    this.setBoundary(U, this.BOUNDS_TYPES.U)
    this.setBoundary(V, this.BOUNDS_TYPES.V)
  }

  //
  // this is the diffuse step from the paper. Stam, Jos
  //
  diffusionStamMethod (D0, D, diff = 1) {
    const a = this.dt * diff
    for (var k = 0; k < this.solverIterations; k++) {
      for (var i = 1; i < D.width - 1; i++) {
        for (var j = 1; j < D.height - 1; j++) {
          const val = (D0.data[this.indx(i, j)] +
                  a * (
                    D.data[this.indx(i - 1, j)] +
                    D.data[this.indx(i + 1, j)] +
                    D.data[this.indx(i, j - 1)] +
                    D.data[this.indx(i, j + 1)]
                  )) / (1 + 4 * a)
          D.data[this.indx(i, j)] = val
        }
      }
    }
    this.setBoundary(D, this.BOUNDS_TYPES.DENSITY)
  }

}

// const [div, size, max, min] = ['layers', 4, 50, -50]
const opts =
  {patchSize: 4, minX: -64, maxX: 64, minY: -64, maxY: 64}
const model = new PatchModel('layers', opts)
model.start()

// debugging
const world = model.world
const patches = model.patches
util.toWindow({ model, world, patches, p: patches.oneOf() })
util.addToDom(patches.pixels.ctx.canvas)
