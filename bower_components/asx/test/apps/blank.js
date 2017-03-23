// Import the lib/ mmodules via relative paths
import util from 'lib/util.js'
import AgentSet from 'lib/AgentSet.js'
import Animator from 'lib/Animator.js'
import Color from 'lib/Color.js'
import ColorMap from 'lib/ColorMap.js'
import DataSet from 'lib/DataSet.js'
import DataSetIO from 'lib/DataSetIO.js'
import Model from 'lib/Model.js'
import Mouse from 'lib/Mouse.js'
import OofA from 'lib/OofA.js'
import Patch from 'lib/Patch.js'
import Patches from 'lib/Patches.js'
import RGBDataSet from 'lib/RGBDataSet.js'

const modules = {
  AgentSet, Animator, Color, ColorMap, DataSet, DataSetIO,
  Mouse, Model, OofA, Patch, Patches, RGBDataSet, util
}
util.toWindow(modules)
console.log('modules:', Object.keys(modules).join(', '))
