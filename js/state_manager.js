function StateManager(parentDiv) {
  // this.parentDiv = parentDiv
  this.selectedChannels = []
  this.csvURL = ''
  this.subplots = false
  this.plotAll = false
  this.plotType = 'scatter'

  this.loadFromJSON = function (jsonString) {
    var loadedState = JSON.parse(jsonString)
    this.selectedChannels = loadedState.selectedChannels
    this.csvURL = loadedState.csvURL
    this.subplots = loadedState.subplots
    this.plotAll = loadedState.plotAll
    this.plotType = loadedState.plotType
  }
}
module.exports = StateManager