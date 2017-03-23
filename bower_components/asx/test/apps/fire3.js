// Import the lib/ mmodules via relative paths
import util from 'lib/util.js'
import Color from 'lib/Color.js'
import ColorMap from 'lib/ColorMap.js'
import Model from 'lib/Model.js'
// import * as THREE from 'etc/three.min.js'
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r82/three.min.js'

const modules = { Color, ColorMap, Model, util, THREE }
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
  camera.position.z = 400

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

class FireModel extends Model {
  constructor (div, worldOptions = {}, contextOptions = {}) {
    super(div, worldOptions, contextOptions)
    this.div.hidden = true
    this.threeObj = initThree(this.patches.pixels.ctx.canvas)
  }
  draw () {
    const pixels = this.patches.pixels
    pixels.ctx.putImageData(pixels.imageData, 0, 0)
    const {renderer, scene, camera, texture, mesh} = this.threeObj
    texture.needsUpdate = true
    mesh.rotation.x += 0.01
    // mesh.rotation.y += 0.01
    renderer.render(scene, camera)
  }

  setup () {
    this.patchBreeds('fires embers')
    this.anim.setRate(60)

    this.fireColorMap = ColorMap.gradientColorMap(6, ['red', [128, 0, 0]])
    this.treeColor = Color.newTypedColor(0, 255, 0)
    this.dirtColor = Color.toTypedColor('yellow')
    this.fireColor = this.fireColorMap[0]

    this.density = 60 // percent
    for (const p of this.patches) {
      if (p.x === this.world.minX)
        this.ignight(p)
      else if (util.randomInt(100) < this.density)
        p.color = this.treeColor
      else
        p.color = this.dirtColor
    }

    this.burnedTrees = 0
    this.initialTrees =
      this.patches.filter(p => p.color.equals(this.treeColor)).length
  }

  step () {
    if (this.fires.length + this.embers.length === 0) {
      console.log('Stopping:', this.anim.toString())
      const percentBurned = this.burnedTrees / this.initialTrees * 100
      console.log('Percent burned', percentBurned.toFixed(2))
      this.stop()
    }

    for (const p of this.fires) {
      for (const n of p.neighbors4)
        if (this.isTree(n))
          this.ignight(n)
      this.embers.setBreed(p)
    }
    this.fadeEmbers()

    if (this.anim.ticks % 100 === 0)
      console.log(this.anim.toString())
  }

  isTree (p) { return p.color.equals(this.treeColor) }

  ignight (p) {
    p.color = this.fireColor
    this.fires.setBreed(p)
    this.burnedTrees++
  }

  fadeEmbers () {
    for (const p of this.embers) {
      const c = p.color
      const ix = this.fireColorMap.indexOf(c)
      if (ix === this.fireColorMap.length - 1)
        this.patches.setBreed(p) // sorta like die, removes from breed.
      else
        p.color = this.fireColorMap[ix + 1]
    }
  }
}
// const [div, size, max, min] = ['layers', 4, 50, -50]
const model = new FireModel('layers', {
  patchSize: 2,
  minX: -125,
  maxX: 125,
  minY: -125,
  maxY: 125
}).start()

// debugging
const world = model.world
const patches = model.patches
util.toWindow({ model, world, patches, p: patches.oneOf() })
// if (world.patchSize !== 1) util.addToDom(patches.pixels.ctx.canvas)
