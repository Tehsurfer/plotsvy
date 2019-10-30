function StateManager(parentDiv) {
  this.selectedChannels = []
  this.csvURL = ''
  this.plotAll = false
  this.plotType = 'scatter'

  this.loadFromJSON = function (jsonString) {
    var loadedState = JSON.parse(jsonString)
    if (loadedState.selectedChannels !== undefined){
      this.selectedChannels = loadedState.selectedChannels
    }
    if (loadedState.csvURL !== undefined){
      this.csvURL = loadedState.csvURL
    }
    if (loadedState.plotAll !== undefined){
      this.plotAll = loadedState.plotAll
    }
    if (loadedState.plotType !== undefined){
      this.plotType = loadedState.plotType
    }
  }
}
module.exports = StateManager