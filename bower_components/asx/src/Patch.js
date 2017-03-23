import Color from './Color.js'

// Objects within AgentSets use "prototypal inheritance".
// The PatchProto is given to Patches for use creating Patch objects.
const PatchProto = {
  // Initialize a Patch given its Patches AgentSet.
  init (agentSet) {
    const defaults = this.baseVariables()
    defaults.world = agentSet.world
    defaults.patches = agentSet.baseSet
    Object.setPrototypeOf(defaults, this)
    return defaults
  },
  // Return an object that will initially be the "default" variables
  // layer in a patch prototype stack.
  // Surprisingly `label` and `color` are not here, they are managed
  // optimally by the Patches AgentSet.
  baseVariables () { // Core variables for patches. Not 'own' variables.
    return {
      id: null,           // unique id, set by agentset's add() method
      agentSet: null,     // my agentset/breed, set by AgentSet ctor
      patches: null,      // my patches/baseSet, set by init()
      labelOffset: [0, 0],  // text pixel offset from the patch center
      labelColor: Color.newTypedColor(0, 0, 0) // the label color
    }
  },

  // Getter for x,y derived from patch id, thus no setter.
  get x () {
    return (this.id % this.world.numX) + this.world.minX
  },
  get y () {
    return this.world.maxY - Math.floor(this.id / this.world.numX)
  },

  // Getter for neighbors of this patch.
  // Uses lazy evaluation to promote neighbors to instance variables.
  // To avoid promotion, use `patches.neighbors(this)`.
  // Promotion makes getters not needed.
  get neighbors () { // lazy promote neighbors from getter to instance prop.
    const n = this.patches.neighbors(this)
    Object.defineProperty(this, 'neighbors', {value: n, enumerable: true})
    return n
  },
  get neighbors4 () {
    const n = this.patches.neighbors4(this)
    Object.defineProperty(this, 'neighbors4', {value: n, enumerable: true})
    return n
  },

  // Manage colors by directly setting pixels in Patches pixels object.
  // With getter/setters, slight performance hit.
  setColor (typedColor) {
    this.patches.pixels.data[this.id] = typedColor.getPixel()
  },
  // Optimization: If shared color provided, sharedColor is modified and
  // returned. Otherwise new color returned.
  getColor (sharedColor = null) {
    const pixel = this.patches.pixels.data[this.id]
    if (sharedColor) {
      sharedColor.pixel = pixel
      return sharedColor
    }
    return Color.toTypedColor(pixel)
  },
  get color () { return this.getColor() },
  set color (typedColor) { return this.setColor(typedColor) },

  // Set label. Erase label via setting to undefined.
  setLabel (label) {
    this.patches.setLabel(this, label)
  },
  getLabel () {
    this.patches.getLabel(this)
  },
  get label () { return this.getLabel() },
  set label (label) { return this.setColor(label) },

  // Return patch dx, dy from my position. Return undefined if off-world.
  patchAt (dx, dy) {
    return this.patches.patch(this.x + dx, this.y + dy)
  },

  // Breed get/set mathods and getter/setter versions.
  setBreed (breed) { breed.setBreed(this) },
  getBreed () { return this.agentSet },
  get breed () { return this.getBreed() },
  set breed (breed) { this.setBreed(breed) }
}
export default PatchProto
