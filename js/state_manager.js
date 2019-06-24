function StateManager(parentDiv) {
  this.parentDiv = parentDiv
  this.selectedChannels = []
  this.csvURL = ''

  this.setURL = function (url) {
    this.selectedChannels = []
    this.csvURL = url
  }

  this.loadFromJSON = function (jsonString) {
    loadedState = JSON.parse(jsonString)
    this.selectedChannels = loadedState.selectedChannels
    this.csvURL = loadedState.csvURL
  }
}
module.exports = StateManager