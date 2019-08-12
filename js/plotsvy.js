/**
* Plotsvy.js is used to manage csv and plotly wrappers
*/

require('.././css/main.css')
require('.././css/util.css')
const UI = require('./ui.js')
const PlotManager = require('./plot_manager.js')
const CsvManager = require('./csv_manager.js')
const SimProcessor = require('./sim_processor.js')
const StateManager = require('./state_manager.js')
const BroadcastChannel = require('broadcast-channel')

// Plotsvy:   Manages the interactions between modules.
//  param: targetDiv - the div container the plot ends up in
function Plotsvy(targetDiv) {
  var ui = undefined
  var parentDiv = undefined
  var plot = undefined
  var csv = undefined
  var state = undefined
  var _this = this
  var bc = new BroadcastChannel.default('plot_channel')
  _this.plot = plot
  _this.sim = undefined

  // Assume default HTML is used if none is provided
  if (targetDiv === null || targetDiv === undefined) {
    parentDiv = document.getElementById('plotsvy-example-panel')
  } else {
    parentDiv = targetDiv
  }


  // initialise: sets up ui and plot, needs DOM to be loaded
  this.initialise = function () {
    ui = new UI(parentDiv)
    plot = new PlotManager(parentDiv)
    csv = new CsvManager()
    _this.csv = csv
    state = new StateManager(parentDiv)
    _this.sim = new SimProcessor(parentDiv, plot)
  }

  this.openBroadcastChannel = function (name) {
    bc.close()
    bc = new BroadcastChannel.default(name)
  }

  this.sendChannelMessage = function (message) {
    bc.postMessage(message)
  }

  // csvChannelCall: Add trace to plot from the choices.js select box
  var csvChannelCall = function () {
    var selectedChannel = parentDiv.querySelector('#select_channel').textContent
    plot.addDataSeriesToChart(csv.getColoumnByName(selectedChannel), csv.getColoumnByIndex(0), selectedChannel)
    state.selectedChannels.push(selectedChannel)
    bc.postMessage({ 'state': _this.exportStateAsString() })
  }

  // checkBoxCall: Function to pass to dat.gui to add trace to plot
  var checkBoxCall = function (channel, index, flag) {
    if (!flag) { // Flag lets us know if checkbox was checked before this click
      plot.addDataSeriesFromDatGui(csv.getColoumnByIndex(index), csv.getColoumnByIndex(0), channel, index)
      state.selectedChannels.push(channel)
    }
    else {
      plot.removeSeries(index)
      ch_ind = state.selectedChannels.indexOf(channel)
      state.selectedChannels.splice(ch_ind, ch_ind + 1) // Remove channel index
    }
    bc.postMessage({ 'state': _this.exportStateAsString() })
  }


  this.openCSV = function (url) {
    return new Promise(function (resolve, reject) {
      csv.loadFile(url).then(_ => {
        setup()
        setTimeout(() => bc.postMessage({ 'state': _this.exportStateAsString() }), 800)
        resolve()
      })
    })
  }

  var openCSVfromState = function (url) {
    return new Promise(function (resolve, reject) {
      if (url === undefined) {
        console.log('Error! Not loading any data into chart!')
        reject()
      }
      csv.loadFile(url).then(_ => {
        setup()
        resolve()
      })
    })
  }

  // setup: calls UI depending on type of data and plots data depending on state.plotall 
  var setup = function () {
    _this.setDataType(csv.getDataType())
    ui.showSelector()
    var headers = [...csv.getHeaders()]
    headers.shift()
    if (state.plotAll) {
      _this.plotAll()
    } else {
      if (headers.length < 100) {
        ui.buildDatGui(exportObject)
        ui.createDatGuiDropdown(headers, checkBoxCall)
      } else {
        ui.createSelectDropdown(headers)
        parentDiv.querySelector('#select_channel').onchange = csvChannelCall
        ui.buildDatGui(exportObject)
      }
      if (!state.plotAll && state.selectedChannels.length === 0) {
        _this.plotByIndex(1)
        setTimeout(_this.updateSize, 500)
      }
    }
  }

  this.plotAll = function () {
    plot.plotAll(csv.getAllData()) // plot all
    ui.hideSelector()
    if (csv.getHeaders().length < 100) {
      for (let i in ui.checkboxElements) {
        ui.checkboxElements[i].__checkbox.checked = true // update dat.gui
      }
    }
    setTimeout(_this.updateSize, 1000)
    state.plotAll = true
  }

  this.hideAll = function () {
    _this.clearChart()
    _this.plotByIndex(1)
    if (csv.getHeaders().length > 100) {
      ui.showSelector()
    } else {
      ui.checkboxElements[0].__checkbox.checked = true
    }
    setTimeout(_this.updateSize, 1000)
    state.plotAll = false
  }


  this.plotByIndex = function (index) {
    var channelName = csv.getHeaderByIndex(index)
    plot.addDataSeriesToChart(csv.getColoumnByIndex(index), csv.getColoumnByIndex(0), channelName)
    state.selectedChannels.push(channelName)
  }

  this.plotByNamePromise = function (channelName) {
    return new Promise(function (resolve, reject) {
      plot.addDataSeriesToChart(csv.getColoumnByName(channelName), csv.getColoumnByIndex(0), channelName)
      resolve()
    })
  }

  this.plotByName = function (channelName) {
    plot.addDataSeriesToChart(csv.getColoumnByName(channelName), csv.getColoumnByIndex(0), channelName)
    state.selectedChannels.push(channelName)
  }

  this.exportStateAsString = function () {
    return JSON.stringify(state)
  }

  this.exportState = function () {
    return state
  }


  this.setSubplotsFlag = function (flag) {
    plot.subplots = flag
    state.subplots = flag
  }

  this.setDataType = function (dataType) {
    plot.plotType = dataType
    state.plotType = dataType
    ui.dataType = dataType
  }

  this.loadState = function (jsonString) {
    return new Promise(function (resolve, reject) {
      _this.clearChart()
      state.loadFromJSON(jsonString)
      openCSVfromState(state.csvURL).then(_ => {
        plot.plotType = state.plotType
        plot.subplots = state.subplots
        if (state.selectedChannels !== undefined) {
          if (state.selectedChannels.length > 0) {
            if (!state.plotAll) {
              plotStateChannels(state.selectedChannels)
            }
          }
        }

        resolve()
      })
    })
  }

  var plotStateChannels = function (channels) {
    _this.plotByNamePromise(channels[0]).then(_ => {
      for (let i = 0; i < channels.length; i++) {
        if (i === 0) {
          continue
        }
        _this.plotByNamePromise(channels[i])
      }
    })
    for (let i in channels) {
      for (let j in ui.checkboxElements) {
        if (ui.checkboxElements[j].property === channels[i]) {
          ui.checkboxElements[j].__checkbox.checked = true
          break
        }
      }
    }
  }

  // ------------ External Calls ------------------

  this.addDataSeriesToChart = function (newSeries, xaxis, id) {
    plot.addDataSeriesToChart(newSeries, xaxis, id)
  }

  this.exportObject = function () {
    return exportObject
  }
  // --------------------------------------------------

  this.clearChart = function () {
    plot.resetChart()
    state.selectedChannels = []
  }

  this.switchAxes = function () {
    _this.clearChart()
    csv.transposeSelf()
    setup()
  }

  this.exportCSV = function () {
    csv.export(state)
  }

  this.exportToOpenCOR = function () {
    csv.exportToOpenCOR(state)
  }
  var exportObject = {
    'Export as CSV': () => csv.export(state),
    'Open in OpenCOR': () => csv.exportForOpenCOR(state),
    'Show All': () => _this.plotAll(),
    'Hide All': () => _this.hideAll(),
    'Switch Axes': () => _this.switchAxes()
  }

  this.updateSize = function () {
    var dataset_div = parentDiv.querySelector('#dataset_div')
    var chart_height = parentDiv.clientHeight - dataset_div.offsetHeight
    plot.resizePlot(parentDiv.clientWidth, chart_height)
  }

  _this.initialise()
}

exports.Plotsvy = Plotsvy
