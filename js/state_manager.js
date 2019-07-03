function StateManager(parentDiv) {
  this.parentDiv = parentDiv
  this.selectedChannels = []
  this.csvURL = ''
  this.subplots = false
  this.plotAll = true

  this.setURL = function (url) {
    this.selectedChannels = []
    this.csvURL = url
  }

  this.loadFromJSON = function (jsonString) {
    loadedState = JSON.parse(jsonString)
    this.selectedChannels = loadedState.selectedChannels
    this.csvURL = loadedState.csvURL
    this.subplots = loadedState.subplots
    this.plotAll = locadedState.plotAll
  }
}
module.exports = StateManager