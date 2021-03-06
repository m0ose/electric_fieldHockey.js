
import util from './bower_components/asx/src/util.js'
import DataSet from './bower_components/asx/src/DataSet.js'
import Animator from './bower_components/asx/src/Animator.js'

const EMPTY = 0
const WALL = 1
const SOURCE = 2
const GOAL = 3
const OUTERSPACE = 4

class Puck {
  constructor(x=0, y=0, vx=0, vy=0, charge=1, mass=1) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    this.charge = charge
    this.mass = mass
    this.radius = 12
  }
}

class Charge {
  constructor(x=0, y=0, value=1) {
    this.x = x
    this.y = y
    this.value = value
  }
}

export default class HockeyModel {

  constructor (divID) {
    this.canvas = document.createElement('canvas')
    this.anim = new Animator(this)
    this.anim.setRate(60)
    this.k = 1
    this.dt = 25
    this.setup()
    this.levels = [
      this.initLevel1,
      this.initLevel2,
      this.initLevel3,
      this.initLevel0,
    ]
    this.currentLevel = 0
    // start first level
    this.gotoLevel(0)
  }

  setup () {
    console.log('setup called')
    this.pucks = []
    this.charges = []
    this.puck = new Puck()
  }

  gotoLevel (n) {
    if (n === undefined) {
      n = this.currentLevel + 1
    }
    this.currentLevel = n % this.levels.length
    this.levels[this.currentLevel].bind(this)()
  }

  loadArenaImage (url, cb=()=>{}) {
    util.imagePromise(url).then((img)=>{
      let data = this.RGB2ArenaDataSet(img)
      this.nestCentroid = this.findCentroidOfSource(data)
      console.log('arena loaded')
      this.image = img
      this.arena = data
      cb()
    })
  }

  step () {
    // this.computeNextPuckRungaKutta(this.puck, this.dt)
    let nextPuck = this.puck
    let collisions
    for( let i=0; i< 200; i++) {
      nextPuck = this.computeNextPuckEuler(nextPuck, this.dt/200)
      collisions = this.checkCollisions(this.puck, nextPuck)
    }
    this.puck = nextPuck
    if (collisions.OUTERSPACE == true) {
      console.log('out in space somewhere')
      this.puckIsDead()
      this.anim.stop()
      setTimeout(()=>{this.anim.start()}, 400)
    } else if (collisions.WALL == true) {
      console.log('collision')
      this.puckIsDead()
      this.anim.stop()
      setTimeout(()=>{this.anim.start()}, 400)
    } else if (collisions.GOAL == true) {
      console.log('WINNER')
      this.anim.stop()
      setTimeout(this.drawWinner.bind(this),60)
      setTimeout(()=>{this.gotoLevel(this.currentLevel + 1)}, 3000)
    }
    if (this.anim.ticks % 200 === 0) {
      console.info(this.anim.toString())
    }
  }

  checkCollisions(puck1, puck2) {
    let hits = {}
    const padding = 100
    if (puck1.x < 0 || puck1.y < 0 || puck1.x > this.arena.width || puck1.y > this.arena.height) {
      if (puck1.x < -padding || puck1.y < -padding || puck1.x > this.arena.width + padding || puck1.y > this.arena.height + padding) {
        hits['OUTERSPACE'] = true
      }
    } else {
      for (let i=0; i<2*Math.PI; i = i+0.5) {
        let [x1,y1] = [puck1.x + puck1.radius * Math.cos(i), puck1.y + puck1.radius * Math.sin(i)]
        let [x2,y2] = [puck2.x + puck2.radius * Math.cos(i), puck2.y + puck2.radius * Math.sin(i)]
        let line = calcStraightLine(x1, y1, x2, y2)
        for(var p of line) {
          let material = this.arena.getXY(Math.round(p[0]), Math.round(p[1]))
          if (material == WALL) {
            hits['WALL'] = true
          }
          if (material == GOAL) {
            hits['GOAL'] = true
          }
        }
      }
    }
    return hits
  }

  computeNextPuckEuler(puck, dt, forRunga = false) {
    let p = puck
    let [Fx, Fy] = this.computeForceAtPoint(p.x, p.y, p.charge)
    let [ax, ay] = [Fx / p.mass, Fy / p.mass]
    let [vx, vy] = [ ax*dt ,  ay*dt ]
    if (!forRunga) {
      [vx, vy] = [ puck.vx + ax*dt , puck.vy + ay*dt ]
    }
    let x = (ax*dt*dt/2) + p.vx*dt + p.x
    let y = (ay*dt*dt/2) + p.vy*dt + p.y
    let p2 = new Puck(x, y, vx, vy, p.charge, p.mass)
    return p2
  }

  computeForceAtPoint(x, y, charge) {
    let Fx = 0
    let Fy = 0
    for (let ch of this.charges) {
      let dx = x-ch.x
      let dy = y-ch.y
      let r = Math.hypot(dx, dy)
      if (r > 0.000001) {
        let F = this.k * (charge * ch.value) / (r*r)
        Fx = Fx + (dx/r)*F
        Fy = Fy + (dy/r)*F
      }
    }
    return [Fx, Fy]
  }

  puckIsDead() {
    this.puck = new Puck(this.nestCentroid.x, this.nestCentroid.y)
  }

  addCharge(x,y,value) {
    this.charges.push(new Charge(x,y,value))
  }

  clearCharges() {
    this.charges = []
  }

  // Levels
  initLevel0() {
    var url = 'levels/hockeyLevel0.png'
    this.loadArenaImage(url, ()=>{
      this.setup()
      this.puckIsDead = () => {
        this.puck = new Puck(this.nestCentroid.x, this.nestCentroid.y)
        this.puck.vx = 0.09
        this.puck.vy = 0.05
      }
      this.puckIsDead()
      this.addCharge(200, 150, -1.8)
      this.anim.start()
    })
  }

  // Levels
  initLevel1() {
    var url = 'levels/hockeyLevel1.png'
    this.loadArenaImage(url, ()=>{
      this.setup()
      this.addCharge(10, 200, 1)
      this.addCharge(400, 90, -1)
      this.addCharge(420, 100, -1)
      this.addCharge(440, 110, -1)
      this.addCharge(460, 120, -1)
      this.addCharge(30, 240, 1)
      this.puckIsDead = () => {
        this.puck = new Puck(this.nestCentroid.x, this.nestCentroid.y)
      }
      this.puckIsDead()
      this.anim.start()
    })
  }

  initLevel2() {
    var url = 'levels/hockeyLevel2.png'
    this.loadArenaImage(url, ()=>{
      this.setup()
      model.addCharge(10,170,1)
      model.addCharge(180,370,1)
      model.addCharge(380,20,1)
      model.addCharge(380,210,-1)
      this.puckIsDead()
      this.anim.start()
    })
  }

  initLevel3() {
    var url = 'levels/hockeyLevel3.png'
    this.loadArenaImage(url, ()=>{
      this.setup()
      model.addCharge(345,290,1)
    //  model.addCharge(165,140,-1)
    //  model.addCharge(155,150,-1)
      model.addCharge(185,210,-1)
      model.addCharge(40,90,1)
      model.addCharge(40,100,1)
      // Credit for this solution goes to Emma Gould
      this.puckIsDead()
      this.anim.start()
    })
  }

  // Draw everything
  draw () {
    this.drawArena()
    this.drawField()
    this.drawCharges()
  }

  drawArena() {
    this.canvas.width = this.image.width
    this.canvas.height = this.image.height
    util.fillCtxWithImage(util.getContext(this.canvas), this.image)
  }

  drawCharges () {
    let ctx = util.getContext(this.canvas)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    for (var ch of this.charges) {
      let r = 10
      ctx.beginPath();
      ctx.arc(ch.x, ch.y, r, 0, 2*Math.PI);
      if (ch.value > 0) {
        ctx.fillStyle = 'red'
        ctx.moveTo(ch.x-r/2, ch.y)
        ctx.lineTo(ch.x+r/2, ch.y)
        ctx.moveTo(ch.x, ch.y-r/2)
        ctx.lineTo(ch.x, ch.y+r/2)
      } else {
        ctx.fillStyle = 'blue'
        ctx.moveTo(ch.x-r/2, ch.y)
        ctx.lineTo(ch.x+r/2, ch.y)
      }
      ctx.fill()
      ctx.stroke()
    }
    // puck
    ctx.beginPath();
    ctx.arc(this.puck.x, this.puck.y, this.puck.radius, 0, 2*Math.PI);
    ctx.moveTo(this.puck.x-this.puck.radius/2, this.puck.y)
    ctx.lineTo(this.puck.x+this.puck.radius/2, this.puck.y)
    ctx.moveTo(this.puck.x, this.puck.y-this.puck.radius/2)
    ctx.lineTo(this.puck.x, this.puck.y+this.puck.radius/2)
    ctx.fillStyle = 'black'
    ctx.fill()
    ctx.stroke()
  }

  drawField () {
    let ctx = util.getContext(this.canvas)
    ctx.lineWidth = 0.5
    for (let x = 0; x < this.arena.width; x += this.arena.width/30) {
      for (let y = 0; y < this.arena.height; y += this.arena.height/30) {
        let [Fx, Fy] = this.computeForceAtPoint(x, y, 1)
        let mag = Math.hypot(Fx, Fy)
        let length = 200000*mag
        length = Math.min(20 , Math.max(4, Math.sqrt(length)) )
        var headlen = Math.min(5,length/2);   // length of head in pixels
        let tox = x + length*Fx/mag
        let toy = y + length*Fy/mag
        var angle = Math.atan2(toy-y,tox-x);
        ctx.beginPath()
        let opacity = Math.min(1.0 , Math.max(0.2, 2000*mag) )
        ctx.strokeStyle = `rgba(0,0,0,${opacity})`
        ctx.moveTo(x, y);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
        ctx.stroke()
      }
    }
  }

  drawWinner () {
    let ctx = util.getContext(this.canvas)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgb(0,255,0)'
    ctx.font="90px Arial";
    ctx.fillText("GOAL!",ctx.canvas.width/2, ctx.canvas.height/4);
  }

  // find center of start location
  findCentroidOfSource (dataset) {
    let [cx, cy] = [0,0]
    let n = 0
    for (let x=0; x<dataset.width; x++) {
      for (let y=0; y<dataset.height; y++) {
        if (dataset.getXY(x,y) == SOURCE) {
          cx += x
          cy += y
          n ++
        }
      }
    }
    if (n>0) {
      cx = cx / n
      cy = cy / n
    }
    return {x:cx, y:cy}
  }

  // rgb image to data set
  RGB2ArenaDataSet (img) {
    const bytes = util.imageToBytes(img)
    const data = new Uint8Array(bytes.buffer) // Parse via a Type view on the buffer
    const width = img.width
    const height = img.height
    let ds = DataSet.emptyDataSet(width, height, Uint8Array)
    var count = [0,0,0,0]
    for (let i=0; i<data.length; i++) {
      let r = data[4*i]
      let g = data[4*i + 1]
      let b = data[4*i + 2]
      if (r > 200 && g < 50 && b < 50) {
        ds.data[i] = GOAL
        count[GOAL] ++
      } else if (r < 50 && g > 200 && b < 50) {
        ds.data[i] = SOURCE
        count[SOURCE] ++
      } else if (r < 50 && g < 50 && b < 50) {
        ds.data[i] = WALL
        count[WALL] ++
      } else {
        ds.data[i] = EMPTY
        count[EMPTY] ++
      }
    }
    console.log(count)
    return ds
  }
}

// util function
function calcStraightLine (startX, startY, endX, endY) {
  var coordinatesArray = []
  // Translate coordinates
  var x1 = Math.round(startX)
  var y1 = Math.round(startY)
  var x2 = Math.round(endX)
  var y2 = Math.round(endY)
  // Define differences and error check
  var dx = Math.abs(x2 - x1)
  var dy = Math.abs(y2 - y1)
  var sx = (x1 < x2) ? 1 : -1
  var sy = (y1 < y2) ? 1 : -1
  var err = dx - dy
  // Set first coordinates
  coordinatesArray.push([x1,y1])
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
      var e2 = err * 2;
      if (e2 > -dy) {
          err -= dy
          x1 += sx
      }
      else if (e2 < dx) {
          err += dx
          y1 += sy
      }
      // Set coordinates
      coordinatesArray.push([x1,y1])
  }
  // Return the result
  return coordinatesArray
}
