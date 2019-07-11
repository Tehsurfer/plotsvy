function StateManager(parentDiv) {
  // this.parentDiv = parentDiv
  this.selectedChannels = []
  this.csvURL = ''
  this.subplots = false
  this.plotAll = true
  this.plotType = 'scatter'

  this.setURL = function (url) {
    this.selectedChannels = []
    this.csvURL = url
  }

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