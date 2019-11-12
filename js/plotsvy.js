/**
* Plotsvy.js is used to manage csv and plotly wrappers
*/

require('.././css/main.css')
require('.././css/util.css')
require('.././css/treeview.css')
const UI = require('./ui.js')
const PlotManager = require('./plot_manager')
const FileManager = require('./file_tree_navigation')
const CsvManager = require('./csv_manager')
const StateManager = require('./state_manager.js')
const BroadcastChannel = require('broadcast-channel')
const plotsvy_html = require('.././snippets/plotsvy.html')

// Plotsvy:   Manages the interactions between modules.
//  param: targetDiv - the div container the plot ends up in
function Plotsvy(targetDiv, inputURL) {
  var ui = undefined
  var parentDiv = undefined
  var plot = undefined
  var csv = undefined
  var state = undefined
  var fileNav = undefined
  var dirString = 'directory-meta'
  var _this = this
  var bc = new BroadcastChannel.default('plot_channel') // For updating other web apps working with Plotsvy
  _this.plot = plot

  // If targetDiv is not provided, we will assume it already exists (this is used for the demo)
  if (targetDiv === null || targetDiv === undefined) {
    parentDiv = document.getElementById('plotsvy-example-panel')
  } else {
    parentDiv = targetDiv
  }


  // initialise: Sets up ui and plot, requires DOM to be loaded (Note: Called on construction)
  this.initialise = function (overRideUrl) {
    parentDiv.append(htmlToElement(plotsvy_html))
    var chartDiv = parentDiv.querySelector('#chart_div')
    ui = new UI(parentDiv)
    plot = new PlotManager(chartDiv)
    csv = new CsvManager()
    _this.csv = csv
    state = new StateManager(parentDiv)
    _this.state = state

    // Check if we have have a URL yet
    if (overRideUrl !== undefined){
      _this.openInputUrl(inputURL)
    } else if (inputURL !== undefined){
      _this.openInputUrl(inputURL)
    }
  }

  // openInputUrl: Opens url in directory or single file mode based on urlstring
  this.openInputUrl = function(url){

    // Multi File
    if (url.includes(dirString)){ 
      ui.showLoadingGif()
      ui.showDirectoryContent()
      _this.createFileNavigation(url).then( _=>{
        ui.hideLoadingGif()
      })
    
    // Single File
    } else { 
      ui.showLoadingGif()
      _this.openCSV(url).then(ui.hideLoadingGif)
    }
  }

  this.openBroadcastChannel = function (name) {
    bc.close()
    bc = new BroadcastChannel.default(name)
  }

  this.sendChannelMessage = function (message) {
    bc.postMessage(message)
  }

  // csvChannelCall: Adds a trace to the plot from 'select_channel' div
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
      state.selectedChannels.splice(ch_ind, ch_ind + 1) // Removes channel index
    }
    bc.postMessage({ 'state': _this.exportStateAsString() })
  }


  this.openCSV = function (url) {
    return new Promise(function (resolve, reject) {
      _this.clearChart()
      ui.showLoadingGif()
      csv.loadFile(url).then(_ => {
        ui.setTitle(csv.getTitle(url))
        setup()
        state.csvURL = url
        setTimeout(() => bc.postMessage({ 'state': _this.exportStateAsString() }), 800)
        ui.hideLoadingGif()
        parentDiv.querySelectorAll('.multi-file')[1].style.display = 'none'
        if(fileNav !== undefined){
          // fileNav.collapseAll()
        }
        resolve()
      })
    })
  }

  var openCSVfromState = function (url) {
    return new Promise(function (resolve, reject) {
      ui.showLoadingGif()
      if (url === undefined) {
        console.log('Error! Not loading any data into chart!')
        reject()
      }
      csv.loadFile(url).then(_ => {
        ui.setTitle(csv.getTitle(url))
        setup()
        ui.hideLoadingGif()
        resolve()
      })
    })
  }

  // setup: Creates different UI's depending on type of data and plots data depending on state.plotall 
  var setup = function () {
    plot.setXaxisLabel(csv.getXaxis())
    _this.setDataType(csv.getDataType())
    ui.showSelector()
    
    var headers = [...csv.getHeaders()]
    headers.shift()
    if (state.plotAll) {
      _this.plotAll()
    } else {

      // Check which functions we need for datgui
      var datguiFunctions = datguiStaticFunctions
      if (csv.getDataType() === 'scatter'){
        datguiFunctions = datguiTimeseriesFunctions
      }

      // Dat.gui UI
      if (headers.length < 100) {
        ui.buildDatGui(datguiFunctions)
        ui.createDatGuiDropdown(headers, checkBoxCall)
      } 

      // Select2 UI for navigating large amounts of headers
      else { 
        ui.createSelectDropdown(headers)
        parentDiv.querySelector('#select_channel').onchange = csvChannelCall
        ui.buildDatGui(datguiFunctions)
      }
      if (!state.plotAll && state.selectedChannels.length === 0) {
        _this.plotByIndex(1)
        setTimeout(_this.updateSize, 500)
      }
    }
  }

  // createFileNavigation: Uses a meta-data url to create navigation
  this.createFileNavigation = function(url){
    return new Promise(function(resolve, reject){
      var fileNavDiv = parentDiv.querySelector('#file_nav')
      fileNav = new FileManager(fileNavDiv, url, _this.openCSV)
      resolve()
    })
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
    if (csv.getHeaders().length > 100) {
      ui.showSelector()
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
      searchResult = csv.getColoumnByName(channelName)
      if (searchResult === false){
        console.log('Could not find channel: "'+ channelName +'" in the loaded csv file')
        reject()
      } else {
        plot.addDataSeriesToChart(searchResult, csv.getColoumnByIndex(0), channelName)
        resolve()
      }
    })
  }

  this.plotByName = function (channelName) {
    searchResult = csv.getColoumnByName(channelName)
    if (searchResult === false){
      console.log('Could not find channel: "'+ channelName +'" in the loaded csv file')
      return false
    }
    plot.addDataSeriesToChart(searchResult, csv.getColoumnByIndex(0), channelName)
    state.selectedChannels.push(channelName)
  }

  this.exportStateAsString = function () {
    return JSON.stringify(state)
  }

  this.exportState = function () {
    return state
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
    if (Array.isArray(channels) === false){ //check if channels is string
      _this.plotByNamePromise(channels)
      state.selectedChannels = [state.selectedChannels] //if channels aren't in array make one
    } else {
      _this.plotByNamePromise(channels[0]).then(_ => { //allow first plot to finish
        for (let i = 0; i < channels.length; i++) {
          if (i === 0) {
            continue
          }
          _this.plotByNamePromise(channels[i]) //add remaining channels
        }
      })
      // Update dat gui via search
      for (let i in channels) {
        for (let j in ui.checkboxElements) {
          if (ui.checkboxElements[j].property === channels[i]) {
            ui.checkboxElements[j].__checkbox.checked = true
            break
          }
        }
      }
    }
  }

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

  var datguiTimeseriesFunctions = {
    'Export as CSV': () => csv.export(state),
    'Open in OpenCOR': () => csv.exportForOpenCOR(state),
    'Show All': () => _this.plotAll(),
    'Hide All': () => _this.hideAll(),
    'Switch Axes': () => _this.switchAxes()
  }

  var datguiStaticFunctions = {
    'Export as CSV': () => csv.export(state),
    'Open in OpenCOR': () => csv.exportForOpenCOR(state),
    'Show All': () => _this.plotAll(),
    'Hide All': () => _this.hideAll(),
    'Switch Axes': () => _this.switchAxes(),
    'Plot as Heatmap': () => _this.heatMapPlotSwitch()
  }

  this.heatMapPlotSwitch = function() {
    if (_this.state.plotType === 'bar'){
      _this.heatMapPlot()
      _this.state.plotType = 'heatmap'
    } else {
      plot.resetChart()
      _this.plotByIndex(1)
      _this.state.plotType = 'bar'
    }
    ui.switchBarHeatmapButton()
  }

  this.heatMapPlot = function(){
    var nested_rows = csv.getAllData()
    var y_headers = csv.getHeaders()
    var x_headers = csv.getColoumnByIndex(0)
    y_headers.shift()
    x_headers.shift()
    plot.heatMapPlot(nested_rows, x_headers, y_headers)
  }

  this.updateSize = function () {
    var dataset_div = parentDiv.querySelector('#dataset_div')
    var chart_height = parentDiv.clientHeight - dataset_div.offsetHeight
    plot.resizePlot(parentDiv.clientWidth, chart_height)
  }

  _this.initialise()
}

htmlToElement = (html) => {
  let template = document.createElement('template')
  html = html.trim() // Never return a text node of whitespace as the result
  template.innerHTML = html
  return template.content.firstChild
}

module.exports = exports = Plotsvy
