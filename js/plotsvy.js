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
window.Plotly = require('plotly.js/dist/plotly')


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
    'Plot as Heatmap': () => _this.heatMapPlotSwitch(),
    'Plot as Dendrogram': () => _this.dendrogram()
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

  this.dendrogram = function (){
    var chartDiv = parentDiv.querySelector('#chart_div')
    create_dendrogram(chartDiv)
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

create_dendrogram = function(div){
window.Plotly.newPlot(
  div,
  [{"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [15.0, 15.0, 25.0, 25.0], "xaxis": "x", "y": [0.0, 30.863646926343094, 30.863646926343094, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [35.0, 35.0, 45.0, 45.0], "xaxis": "x", "y": [0.0, 28.477149389896862, 28.477149389896862, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [65.0, 65.0, 75.0, 75.0], "xaxis": "x", "y": [0.0, 23.152532702036016, 23.152532702036016, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [185.0, 185.0, 195.0, 195.0], "xaxis": "x", "y": [0.0, 4.9647285603898865, 4.9647285603898865, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [175.0, 175.0, 190.0, 190.0], "xaxis": "x", "y": [0.0, 5.833471469356037, 5.833471469356037, 4.9647285603898865], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [165.0, 165.0, 182.5, 182.5], "xaxis": "x", "y": [0.0, 8.509402866477144, 8.509402866477144, 5.833471469356037], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [155.0, 155.0, 173.75, 173.75], "xaxis": "x", "y": [0.0, 9.576389663428545, 9.576389663428545, 8.509402866477144], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [145.0, 145.0, 164.375, 164.375], "xaxis": "x", "y": [0.0, 11.781278542581921, 11.781278542581921, 9.576389663428545], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [135.0, 135.0, 154.6875, 154.6875], "xaxis": "x", "y": [0.0, 12.975612108274028, 12.975612108274028, 11.781278542581921], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [125.0, 125.0, 144.84375, 144.84375], "xaxis": "x", "y": [0.0, 14.898496868456848, 14.898496868456848, 12.975612108274028], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [115.0, 115.0, 134.921875, 134.921875], "xaxis": "x", "y": [0.0, 16.145697087483104, 16.145697087483104, 14.898496868456848], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [105.0, 105.0, 124.9609375, 124.9609375], "xaxis": "x", "y": [0.0, 19.604590916253063, 19.604590916253063, 16.145697087483104], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [95.0, 95.0, 114.98046875, 114.98046875], "xaxis": "x", "y": [0.0, 20.750900902767633, 20.750900902767633, 19.604590916253063], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [85.0, 85.0, 104.990234375, 104.990234375], "xaxis": "x", "y": [0.0, 22.371532507600033, 22.371532507600033, 20.750900902767633], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [225.0, 225.0, 235.0, 235.0], "xaxis": "x", "y": [0.0, 20.502421560843754, 20.502421560843754, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [215.0, 215.0, 230.0, 230.0], "xaxis": "x", "y": [0.0, 21.92606447937528, 21.92606447937528, 20.502421560843754], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [205.0, 205.0, 222.5, 222.5], "xaxis": "x", "y": [0.0, 22.472992573289048, 22.472992573289048, 21.92606447937528], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [94.9951171875, 94.9951171875, 213.75, 213.75], "xaxis": "x", "y": [22.371532507600033, 25.914676203993743, 25.914676203993743, 22.472992573289048], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [70.0, 70.0, 154.37255859375, 154.37255859375], "xaxis": "x", "y": [23.152532702036016, 26.370624593205584, 26.370624593205584, 25.914676203993743], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [55.0, 55.0, 112.186279296875, 112.186279296875], "xaxis": "x", "y": [0.0, 27.542921625367736, 27.542921625367736, 26.370624593205584], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(255,65,54)"}, "mode": "lines", "type": "scatter", "x": [255.0, 255.0, 265.0, 265.0], "xaxis": "x", "y": [0.0, 26.141351843997274, 26.141351843997274, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [245.0, 245.0, 260.0, 260.0], "xaxis": "x", "y": [0.0, 28.324096526287104, 28.324096526287104, 26.141351843997274], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [83.5931396484375, 83.5931396484375, 252.5, 252.5], "xaxis": "x", "y": [27.542921625367736, 29.296386459055306, 29.296386459055306, 28.324096526287104], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [40.0, 40.0, 168.04656982421875, 168.04656982421875], "xaxis": "x", "y": [28.477149389896862, 31.91749869035003, 31.91749869035003, 29.296386459055306], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [20.0, 20.0, 104.02328491210938, 104.02328491210938], "xaxis": "x", "y": [30.863646926343094, 32.82186619315337, 32.82186619315337, 31.91749869035003], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [275.0, 275.0, 285.0, 285.0], "xaxis": "x", "y": [0.0, 35.71359942427759, 35.71359942427759, 0.0], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [62.01164245605469, 62.01164245605469, 280.0, 280.0], "xaxis": "x", "y": [32.82186619315337, 36.20670793006779, 36.20670793006779, 35.71359942427759], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [5.0, 5.0, 171.00582122802734, 171.00582122802734], "xaxis": "x", "y": [0.0, 38.05511319964494, 38.05511319964494, 36.20670793006779], "yaxis": "y2"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -30.863646926343094, -30.863646926343094, -0.0], "xaxis": "x2", "y": [15.0, 15.0, 25.0, 25.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -28.477149389896862, -28.477149389896862, -0.0], "xaxis": "x2", "y": [35.0, 35.0, 45.0, 45.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -23.152532702036016, -23.152532702036016, -0.0], "xaxis": "x2", "y": [65.0, 65.0, 75.0, 75.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -4.9647285603898865, -4.9647285603898865, -0.0], "xaxis": "x2", "y": [185.0, 185.0, 195.0, 195.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -5.833471469356037, -5.833471469356037, -4.9647285603898865], "xaxis": "x2", "y": [175.0, 175.0, 190.0, 190.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -8.509402866477144, -8.509402866477144, -5.833471469356037], "xaxis": "x2", "y": [165.0, 165.0, 182.5, 182.5], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -9.576389663428545, -9.576389663428545, -8.509402866477144], "xaxis": "x2", "y": [155.0, 155.0, 173.75, 173.75], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -11.781278542581921, -11.781278542581921, -9.576389663428545], "xaxis": "x2", "y": [145.0, 145.0, 164.375, 164.375], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -12.975612108274028, -12.975612108274028, -11.781278542581921], "xaxis": "x2", "y": [135.0, 135.0, 154.6875, 154.6875], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -14.898496868456848, -14.898496868456848, -12.975612108274028], "xaxis": "x2", "y": [125.0, 125.0, 144.84375, 144.84375], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -16.145697087483104, -16.145697087483104, -14.898496868456848], "xaxis": "x2", "y": [115.0, 115.0, 134.921875, 134.921875], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -19.604590916253063, -19.604590916253063, -16.145697087483104], "xaxis": "x2", "y": [105.0, 105.0, 124.9609375, 124.9609375], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -20.750900902767633, -20.750900902767633, -19.604590916253063], "xaxis": "x2", "y": [95.0, 95.0, 114.98046875, 114.98046875], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -22.371532507600033, -22.371532507600033, -20.750900902767633], "xaxis": "x2", "y": [85.0, 85.0, 104.990234375, 104.990234375], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -20.502421560843754, -20.502421560843754, -0.0], "xaxis": "x2", "y": [225.0, 225.0, 235.0, 235.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -21.92606447937528, -21.92606447937528, -20.502421560843754], "xaxis": "x2", "y": [215.0, 215.0, 230.0, 230.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -22.472992573289048, -22.472992573289048, -21.92606447937528], "xaxis": "x2", "y": [205.0, 205.0, 222.5, 222.5], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-22.371532507600033, -25.914676203993743, -25.914676203993743, -22.472992573289048], "xaxis": "x2", "y": [94.9951171875, 94.9951171875, 213.75, 213.75], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(61,153,112)"}, "mode": "lines", "type": "scatter", "x": [-23.152532702036016, -26.370624593205584, -26.370624593205584, -25.914676203993743], "xaxis": "x2", "y": [70.0, 70.0, 154.37255859375, 154.37255859375], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -27.542921625367736, -27.542921625367736, -26.370624593205584], "xaxis": "x2", "y": [55.0, 55.0, 112.186279296875, 112.186279296875], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(255,65,54)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -26.141351843997274, -26.141351843997274, -0.0], "xaxis": "x2", "y": [255.0, 255.0, 265.0, 265.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -28.324096526287104, -28.324096526287104, -26.141351843997274], "xaxis": "x2", "y": [245.0, 245.0, 260.0, 260.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-27.542921625367736, -29.296386459055306, -29.296386459055306, -28.324096526287104], "xaxis": "x2", "y": [83.5931396484375, 83.5931396484375, 252.5, 252.5], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-28.477149389896862, -31.91749869035003, -31.91749869035003, -29.296386459055306], "xaxis": "x2", "y": [40.0, 40.0, 168.04656982421875, 168.04656982421875], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-30.863646926343094, -32.82186619315337, -32.82186619315337, -31.91749869035003], "xaxis": "x2", "y": [20.0, 20.0, 104.02328491210938, 104.02328491210938], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -35.71359942427759, -35.71359942427759, -0.0], "xaxis": "x2", "y": [275.0, 275.0, 285.0, 285.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-32.82186619315337, -36.20670793006779, -36.20670793006779, -35.71359942427759], "xaxis": "x2", "y": [62.01164245605469, 62.01164245605469, 280.0, 280.0], "yaxis": "y"}, {"hoverinfo": "text", "marker": {"color": "rgb(0,116,217)"}, "mode": "lines", "type": "scatter", "x": [-0.0, -38.05511319964494, -38.05511319964494, -36.20670793006779], "xaxis": "x2", "y": [5.0, 5.0, 171.00582122802734, 171.00582122802734], "yaxis": "y"}, {"colorscale": [[0.0, "rgb(247,251,255)"], [0.125, "rgb(222,235,247)"], [0.25, "rgb(198,219,239)"], [0.375, "rgb(158,202,225)"], [0.5, "rgb(107,174,214)"], [0.625, "rgb(66,146,198)"], [0.75, "rgb(33,113,181)"], [0.875, "rgb(8,81,156)"], [1.0, "rgb(8,48,107)"]], "type": "heatmap", "x": [5.0, 15.0, 25.0, 35.0, 45.0, 55.0, 65.0, 75.0, 85.0, 95.0, 105.0, 115.0, 125.0, 135.0, 145.0, 155.0, 165.0, 175.0, 185.0, 195.0, 205.0, 215.0, 225.0, 235.0, 245.0, 255.0, 265.0, 275.0, 285.0], "y": [5.0, 15.0, 25.0, 35.0, 45.0, 55.0, 65.0, 75.0, 85.0, 95.0, 105.0, 115.0, 125.0, 135.0, 145.0, 155.0, 165.0, 175.0, 185.0, 195.0, 205.0, 215.0, 225.0, 235.0, 245.0, 255.0, 265.0, 275.0, 285.0], "z": [[0.0, 35.23046359002623, 34.56414422577457, 35.63593241258415, 37.81903491411236, 33.62059766084612, 34.57071656844095, 32.85226679790273, 31.62263252330369, 30.24948010263876, 33.82601474076423, 30.837995770515757, 30.48899914924142, 25.895813042762487, 29.31159788317574, 29.635823966103754, 29.280880316857225, 28.68862729876749, 28.321469390125916, 29.349375995567442, 34.033553706010636, 33.94839523161914, 35.03042358343224, 32.472232805308394, 36.14084275989415, 35.146363217963206, 35.88231935943883, 38.05511319964494, 37.70273663737068], [35.23046359002623, 0.0, 30.863646926343094, 30.967056676397934, 32.42511489415712, 32.66996197529693, 28.699937890680406, 30.108284389777797, 26.451198499754316, 25.89078027773591, 29.12138265771589, 26.554546890761152, 25.314470331494643, 24.820747387087422, 24.499335771558425, 24.341541005623647, 23.6206402128532, 23.801544873485046, 23.34560658806563, 23.54848443439628, 29.27906988220278, 25.783980212789682, 28.744827920013478, 25.613473299704214, 29.860832760293146, 29.0525375025576, 30.039634613651568, 33.9805243882089, 32.95089479939484], [34.56414422577457, 30.863646926343094, 0.0, 31.179306528627745, 32.82186619315337, 30.159812998585238, 29.00388587022972, 27.166574404958972, 28.15285921839538, 25.637456990167408, 27.658163445806224, 25.76337661351612, 24.455225236904408, 24.765193196408756, 23.89520245087186, 23.413347582054914, 22.23972535002965, 22.929713831634007, 22.817220790872806, 22.988786306958755, 26.08224956417117, 24.840344405336396, 26.85848223439202, 24.97072930049643, 31.12699962428756, 29.746350726087915, 30.511748501405688, 32.57747398534116, 31.416796006334806], [35.63593241258415, 30.967056676397934, 31.179306528627745, 0.0, 28.477149389896862, 31.810084509361833, 26.65205289459778, 27.21228648626497, 30.401540266814703, 28.31303674908128, 29.809725482533167, 26.517178385161213, 25.70169886579058, 26.336813563872774, 24.210323745358288, 24.31558573107371, 22.291999652546423, 24.484984744615197, 24.126511875009207, 24.045914423906023, 28.9241676894146, 26.475538925536917, 27.8368121560799, 25.69391821182039, 29.630451229281412, 30.23553375918335, 29.01307360391768, 31.68719141227407, 36.19989132963819], [37.81903491411236, 32.42511489415712, 32.82186619315337, 28.477149389896862, 0.0, 31.91749869035003, 29.808047477840525, 30.622268397406277, 30.407831656410906, 28.09834473416621, 28.62157565522075, 26.610052551789657, 26.67983187452344, 27.306336601135428, 26.42116884014651, 26.075669233596983, 25.474595209999897, 24.924765229257446, 24.990142098372925, 25.04614698492105, 29.010185557034816, 28.58287588896949, 29.66888254637991, 28.359374157334216, 30.57111877736197, 30.48991366596866, 31.78041817563618, 36.20670793006779, 35.04374726754699], [33.62059766084612, 32.66996197529693, 30.159812998585238, 31.810084509361833, 31.91749869035003, 0.0, 26.773413106148876, 27.542921625367736, 25.988442631844343, 26.761585381046167, 26.56163545963345, 23.586280216311682, 23.72986905949919, 23.988978011958213, 22.84202174477492, 23.289448050465015, 22.19473492425977, 22.26323247311522, 21.7799478875471, 22.03959500875336, 27.1449925318876, 26.63374930630221, 27.478022595425003, 26.409384724256217, 29.296386459055306, 29.166707815179564, 28.873904341401566, 32.36952060002434, 32.46381067201164], [34.57071656844095, 28.699937890680406, 29.00388587022972, 26.65205289459778, 29.808047477840525, 26.773413106148876, 0.0, 23.152532702036016, 24.947420406082003, 21.880749310646248, 25.78124090319314, 22.055669125949777, 21.491579866692184, 21.848646151301804, 19.63187573794343, 19.243106287567986, 17.637791342614886, 19.568139013712223, 18.922799427926474, 19.315298932553898, 23.892358150270844, 23.46744059154315, 24.22881678039839, 22.932654607692808, 27.180797735848945, 28.83184399177484, 26.93637853326518, 30.618470785303447, 30.90193446498467], [32.85226679790273, 30.108284389777797, 27.166574404958972, 27.21228648626497, 30.622268397406277, 27.542921625367736, 23.152532702036016, 0.0, 26.162932276493475, 23.423468924696937, 25.572123338122143, 23.242482860800184, 22.075673780937514, 21.15362948493523, 20.45686505328167, 20.519258070487957, 19.32784142864489, 19.94242097256083, 20.419264155027374, 20.377044608896217, 26.370624593205584, 24.232513391146558, 24.82825746682915, 24.6017242177464, 28.72800493331618, 27.969155083165038, 26.718079367163718, 27.45327699054677, 29.179304849524325], [31.62263252330369, 26.451198499754316, 28.15285921839538, 30.401540266814703, 30.407831656410906, 25.988442631844343, 24.947420406082003, 26.162932276493475, 0.0, 22.371532507600033, 21.357204855689844, 22.00342706087463, 20.9966612216686, 20.462554023400156, 19.286636873340434, 19.4065874627567, 19.59797345197301, 18.641913166565374, 18.096932927783545, 18.185541677502563, 25.914676203993743, 25.580855926319785, 23.729724509516586, 23.75634749002434, 26.214209299619146, 26.652962126487044, 28.31101211237435, 29.180318932451627, 30.783703270005258], [30.24948010263876, 25.89078027773591, 25.637456990167408, 28.31303674908128, 28.09834473416621, 26.761585381046167, 21.880749310646248, 23.423468924696937, 22.371532507600033, 0.0, 20.750900902767633, 20.433406085767086, 17.33941995260507, 16.555574369505237, 17.23364897563304, 16.47212490556123, 16.14753270009746, 14.591549887560932, 14.767336497867806, 15.015913300821124, 23.359598531132107, 23.526299685327952, 20.844938845081654, 20.713755490319716, 25.847764646310466, 25.728449568799263, 26.477884492069148, 27.495266754317623, 28.75489371572049], [33.82601474076423, 29.12138265771589, 27.658163445806224, 29.809725482533167, 28.62157565522075, 26.56163545963345, 25.78124090319314, 25.572123338122143, 21.357204855689844, 20.750900902767633, 0.0, 19.604590916253063, 18.63487724722636, 17.32227575866998, 19.230505831097314, 17.853867496523545, 17.69143739346064, 16.110850270678235, 15.430984117923655, 15.630533852866067, 24.74649695511029, 23.15930438379197, 19.780498734768443, 22.821296329965445, 27.522322260999296, 24.46459829399761, 27.00551825679727, 27.903632283726036, 30.05632765287478], [30.837995770515757, 26.554546890761152, 25.76337661351612, 26.517178385161213, 26.610052551789657, 23.586280216311682, 22.055669125949777, 23.242482860800184, 22.00342706087463, 20.433406085767086, 19.604590916253063, 0.0, 16.145697087483104, 15.765156563864268, 15.01135422725096, 13.717872403274319, 14.384122400012545, 13.448805728213395, 12.743060342452075, 12.7837533767562, 22.226878488949534, 20.951513634742597, 20.56368480482923, 19.997499629241744, 23.624985289574877, 22.957942507651264, 23.444111520515413, 27.59568155581587, 27.75494060028077], [30.48899914924142, 25.314470331494643, 24.455225236904408, 25.70169886579058, 26.67983187452344, 23.72986905949919, 21.491579866692184, 22.075673780937514, 20.9966612216686, 17.33941995260507, 18.63487724722636, 16.145697087483104, 0.0, 13.966535848124762, 14.898496868456848, 12.81605326683893, 12.260536185689732, 10.63137942670645, 11.018276084945814, 11.218772764647161, 20.10764578478551, 19.28827521991226, 18.060698845494827, 16.024359342696744, 23.345661417577986, 20.677509806123606, 23.45837769766365, 25.176976952223715, 27.39897951629406], [25.895813042762487, 24.820747387087422, 24.765193196408756, 26.336813563872774, 27.306336601135428, 23.988978011958213, 21.848646151301804, 21.15362948493523, 20.462554023400156, 16.555574369505237, 17.32227575866998, 15.765156563864268, 13.966535848124762, 0.0, 12.975612108274028, 11.90218672614215, 12.000567473404946, 9.356791856048185, 9.373820665561448, 10.381271898006675, 20.03989811347143, 19.47030753007731, 17.60628484630387, 17.942246635754284, 22.837438873045013, 22.580557569253635, 22.84326761504112, 24.978377269092732, 26.4326188332339], [29.31159788317574, 24.499335771558425, 23.89520245087186, 24.210323745358288, 26.42116884014651, 22.84202174477492, 19.63187573794343, 20.45686505328167, 19.286636873340434, 17.23364897563304, 19.230505831097314, 15.01135422725096, 14.898496868456848, 12.975612108274028, 0.0, 11.781278542581921, 10.983534656666672, 11.130119731793409, 10.646282945080564, 10.388744308137433, 20.10615044497075, 18.438596385817707, 17.282306889584124, 17.85813001771776, 21.37533445598732, 22.615386626342854, 22.388766991060038, 25.7718063704167, 25.33604859483323], [29.635823966103754, 24.341541005623647, 23.413347582054914, 24.31558573107371, 26.075669233596983, 23.289448050465015, 19.243106287567986, 20.519258070487957, 19.4065874627567, 16.47212490556123, 17.853867496523545, 13.717872403274319, 12.81605326683893, 11.90218672614215, 11.781278542581921, 0.0, 9.576389663428545, 9.269343843455394, 8.232701414354715, 8.372786088172893, 19.83833565204988, 17.87811263097672, 17.230208293491998, 16.470898389788882, 22.056505006126972, 21.45470049269293, 22.163227334861187, 24.857284829195336, 27.58025612525802], [29.280880316857225, 23.6206402128532, 22.23972535002965, 22.291999652546423, 25.474595209999897, 22.19473492425977, 17.637791342614886, 19.32784142864489, 19.59797345197301, 16.14753270009746, 17.69143739346064, 14.384122400012545, 12.260536185689732, 12.000567473404946, 10.983534656666672, 9.576389663428545, 0.0, 8.509402866477144, 8.504002479312543, 8.494001256176992, 18.2322037786506, 16.63025346557965, 16.01332258617849, 15.082766588808136, 21.50736204815289, 21.64480481984716, 21.545032330384224, 23.88345544724192, 26.19020839184248], [28.68862729876749, 23.801544873485046, 22.929713831634007, 24.484984744615197, 24.924765229257446, 22.26323247311522, 19.568139013712223, 19.94242097256083, 18.641913166565374, 14.591549887560932, 16.110850270678235, 13.448805728213395, 10.63137942670645, 9.356791856048185, 11.130119731793409, 9.269343843455394, 8.509402866477144, 0.0, 5.71853646980345, 5.833471469356037, 18.51276395281029, 17.61921738243884, 15.495405961303314, 15.822149599374669, 21.388515142274468, 20.975597114781017, 22.17676055800439, 24.202734434297714, 25.218944780978273], [28.321469390125916, 23.34560658806563, 22.817220790872806, 24.126511875009207, 24.990142098372925, 21.7799478875471, 18.922799427926474, 20.419264155027374, 18.096932927783545, 14.767336497867806, 15.430984117923655, 12.743060342452075, 11.018276084945814, 9.373820665561448, 10.646282945080564, 8.232701414354715, 8.504002479312543, 5.71853646980345, 0.0, 4.9647285603898865, 17.98643990473224, 16.75714815041717, 15.345604226889561, 16.348720883194478, 20.491211213800597, 20.318591199972094, 21.98924166188599, 23.35810673231865, 25.287645758368676], [29.349375995567442, 23.54848443439628, 22.988786306958755, 24.045914423906023, 25.04614698492105, 22.03959500875336, 19.315298932553898, 20.377044608896217, 18.185541677502563, 15.015913300821124, 15.630533852866067, 12.7837533767562, 11.218772764647161, 10.381271898006675, 10.388744308137433, 8.372786088172893, 8.494001256176992, 5.833471469356037, 4.9647285603898865, 0.0, 18.802863722094255, 17.43178547292617, 15.168755308349606, 16.216553712525794, 21.542638615256134, 20.82740650178577, 21.85288010891684, 23.497517511252333, 25.630325063174915], [34.033553706010636, 29.27906988220278, 26.08224956417117, 28.9241676894146, 29.010185557034816, 27.1449925318876, 23.892358150270844, 26.370624593205584, 25.914676203993743, 23.359598531132107, 24.74649695511029, 22.226878488949534, 20.10764578478551, 20.03989811347143, 20.10615044497075, 19.83833565204988, 18.2322037786506, 18.51276395281029, 17.98643990473224, 18.802863722094255, 0.0, 21.98902588986294, 22.472992573289048, 22.0912372237284, 26.963523513557902, 26.32924656452915, 26.2088766049195, 29.71869780146714, 29.865511965131947], [33.94839523161914, 25.783980212789682, 24.840344405336396, 26.475538925536917, 28.58287588896949, 26.63374930630221, 23.46744059154315, 24.232513391146558, 25.580855926319785, 23.526299685327952, 23.15930438379197, 20.951513634742597, 19.28827521991226, 19.47030753007731, 18.438596385817707, 17.87811263097672, 16.63025346557965, 17.61921738243884, 16.75714815041717, 17.43178547292617, 21.98902588986294, 0.0, 21.92606447937528, 20.924880712106784, 24.995234704189265, 26.016356558088486, 25.71177384102038, 28.02555375067467, 30.168123856066295], [35.03042358343224, 28.744827920013478, 26.85848223439202, 27.8368121560799, 29.66888254637991, 27.478022595425003, 24.22881678039839, 24.82825746682915, 23.729724509516586, 20.844938845081654, 19.780498734768443, 20.56368480482923, 18.060698845494827, 17.60628484630387, 17.282306889584124, 17.230208293491998, 16.01332258617849, 15.495405961303314, 15.345604226889561, 15.168755308349606, 22.472992573289048, 21.92606447937528, 0.0, 20.502421560843754, 23.692779883224727, 23.52180075907649, 25.740081829697218, 26.353504167634952, 27.856191919910113], [32.472232805308394, 25.613473299704214, 24.97072930049643, 25.69391821182039, 28.359374157334216, 26.409384724256217, 22.932654607692808, 24.6017242177464, 23.75634749002434, 20.713755490319716, 22.821296329965445, 19.997499629241744, 16.024359342696744, 17.942246635754284, 17.85813001771776, 16.470898389788882, 15.082766588808136, 15.822149599374669, 16.348720883194478, 16.216553712525794, 22.0912372237284, 20.924880712106784, 20.502421560843754, 0.0, 24.12262618166985, 24.155133640598258, 25.441040654443913, 28.73194817639794, 30.107490498387534], [36.14084275989415, 29.860832760293146, 31.12699962428756, 29.630451229281412, 30.57111877736197, 29.296386459055306, 27.180797735848945, 28.72800493331618, 26.214209299619146, 25.847764646310466, 27.522322260999296, 23.624985289574877, 23.345661417577986, 22.837438873045013, 21.37533445598732, 22.056505006126972, 21.50736204815289, 21.388515142274468, 20.491211213800597, 21.542638615256134, 26.963523513557902, 24.995234704189265, 23.692779883224727, 24.12262618166985, 0.0, 28.324096526287104, 27.80637906126145, 31.73725094998829, 33.434473832832005], [35.146363217963206, 29.0525375025576, 29.746350726087915, 30.23553375918335, 30.48991366596866, 29.166707815179564, 28.83184399177484, 27.969155083165038, 26.652962126487044, 25.728449568799263, 24.46459829399761, 22.957942507651264, 20.677509806123606, 22.580557569253635, 22.615386626342854, 21.45470049269293, 21.64480481984716, 20.975597114781017, 20.318591199972094, 20.82740650178577, 26.32924656452915, 26.016356558088486, 23.52180075907649, 24.155133640598258, 28.324096526287104, 0.0, 26.141351843997274, 30.22421390576867, 31.992677226948548], [35.88231935943883, 30.039634613651568, 30.511748501405688, 29.01307360391768, 31.78041817563618, 28.873904341401566, 26.93637853326518, 26.718079367163718, 28.31101211237435, 26.477884492069148, 27.00551825679727, 23.444111520515413, 23.45837769766365, 22.84326761504112, 22.388766991060038, 22.163227334861187, 21.545032330384224, 22.17676055800439, 21.98924166188599, 21.85288010891684, 26.2088766049195, 25.71177384102038, 25.740081829697218, 25.441040654443913, 27.80637906126145, 26.141351843997274, 0.0, 30.466048857919322, 34.56424400035678], [38.05511319964494, 33.9805243882089, 32.57747398534116, 31.68719141227407, 36.20670793006779, 32.36952060002434, 30.618470785303447, 27.45327699054677, 29.180318932451627, 27.495266754317623, 27.903632283726036, 27.59568155581587, 25.176976952223715, 24.978377269092732, 25.7718063704167, 24.857284829195336, 23.88345544724192, 24.202734434297714, 23.35810673231865, 23.497517511252333, 29.71869780146714, 28.02555375067467, 26.353504167634952, 28.73194817639794, 31.73725094998829, 30.22421390576867, 30.466048857919322, 0.0, 35.71359942427759], [37.70273663737068, 32.95089479939484, 31.416796006334806, 36.19989132963819, 35.04374726754699, 32.46381067201164, 30.90193446498467, 29.179304849524325, 30.783703270005258, 28.75489371572049, 30.05632765287478, 27.75494060028077, 27.39897951629406, 26.4326188332339, 25.33604859483323, 27.58025612525802, 26.19020839184248, 25.218944780978273, 25.287645758368676, 25.630325063174915, 29.865511965131947, 30.168123856066295, 27.856191919910113, 30.107490498387534, 33.434473832832005, 31.992677226948548, 34.56424400035678, 35.71359942427759, 0.0]]}],
  {"autosize": false, "height": 800, "hovermode": "closest", "showlegend": false, "template": {"data": {"bar": [{"error_x": {"color": "#2a3f5f"}, "error_y": {"color": "#2a3f5f"}, "marker": {"line": {"color": "#E5ECF6", "width": 0.5}}, "type": "bar"}], "barpolar": [{"marker": {"line": {"color": "#E5ECF6", "width": 0.5}}, "type": "barpolar"}], "carpet": [{"aaxis": {"endlinecolor": "#2a3f5f", "gridcolor": "white", "linecolor": "white", "minorgridcolor": "white", "startlinecolor": "#2a3f5f"}, "baxis": {"endlinecolor": "#2a3f5f", "gridcolor": "white", "linecolor": "white", "minorgridcolor": "white", "startlinecolor": "#2a3f5f"}, "type": "carpet"}], "choropleth": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "type": "choropleth"}], "contour": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "contour"}], "contourcarpet": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "type": "contourcarpet"}], "heatmap": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "heatmap"}], "heatmapgl": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "heatmapgl"}], "histogram": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "histogram"}], "histogram2d": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "histogram2d"}], "histogram2dcontour": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "histogram2dcontour"}], "mesh3d": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "type": "mesh3d"}], "parcoords": [{"line": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "parcoords"}], "scatter": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scatter"}], "scatter3d": [{"line": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scatter3d"}], "scattercarpet": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scattercarpet"}], "scattergeo": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scattergeo"}], "scattergl": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scattergl"}], "scattermapbox": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scattermapbox"}], "scatterpolar": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scatterpolar"}], "scatterpolargl": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scatterpolargl"}], "scatterternary": [{"marker": {"colorbar": {"outlinewidth": 0, "ticks": ""}}, "type": "scatterternary"}], "surface": [{"colorbar": {"outlinewidth": 0, "ticks": ""}, "colorscale": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "type": "surface"}], "table": [{"cells": {"fill": {"color": "#EBF0F8"}, "line": {"color": "white"}}, "header": {"fill": {"color": "#C8D4E3"}, "line": {"color": "white"}}, "type": "table"}]}, "layout": {"annotationdefaults": {"arrowcolor": "#2a3f5f", "arrowhead": 0, "arrowwidth": 1}, "colorscale": {"diverging": [[0, "#8e0152"], [0.1, "#c51b7d"], [0.2, "#de77ae"], [0.3, "#f1b6da"], [0.4, "#fde0ef"], [0.5, "#f7f7f7"], [0.6, "#e6f5d0"], [0.7, "#b8e186"], [0.8, "#7fbc41"], [0.9, "#4d9221"], [1, "#276419"]], "sequential": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]], "sequentialminus": [[0.0, "#0d0887"], [0.1111111111111111, "#46039f"], [0.2222222222222222, "#7201a8"], [0.3333333333333333, "#9c179e"], [0.4444444444444444, "#bd3786"], [0.5555555555555556, "#d8576b"], [0.6666666666666666, "#ed7953"], [0.7777777777777778, "#fb9f3a"], [0.8888888888888888, "#fdca26"], [1.0, "#f0f921"]]}, "colorway": ["#636efa", "#EF553B", "#00cc96", "#ab63fa", "#FFA15A", "#19d3f3", "#FF6692", "#B6E880", "#FF97FF", "#FECB52"], "font": {"color": "#2a3f5f"}, "geo": {"bgcolor": "white", "lakecolor": "white", "landcolor": "#E5ECF6", "showlakes": true, "showland": true, "subunitcolor": "white"}, "hoverlabel": {"align": "left"}, "hovermode": "closest", "mapbox": {"style": "light"}, "paper_bgcolor": "white", "plot_bgcolor": "#E5ECF6", "polar": {"angularaxis": {"gridcolor": "white", "linecolor": "white", "ticks": ""}, "bgcolor": "#E5ECF6", "radialaxis": {"gridcolor": "white", "linecolor": "white", "ticks": ""}}, "scene": {"xaxis": {"backgroundcolor": "#E5ECF6", "gridcolor": "white", "gridwidth": 2, "linecolor": "white", "showbackground": true, "ticks": "", "zerolinecolor": "white"}, "yaxis": {"backgroundcolor": "#E5ECF6", "gridcolor": "white", "gridwidth": 2, "linecolor": "white", "showbackground": true, "ticks": "", "zerolinecolor": "white"}, "zaxis": {"backgroundcolor": "#E5ECF6", "gridcolor": "white", "gridwidth": 2, "linecolor": "white", "showbackground": true, "ticks": "", "zerolinecolor": "white"}}, "shapedefaults": {"line": {"color": "#2a3f5f"}}, "ternary": {"aaxis": {"gridcolor": "white", "linecolor": "white", "ticks": ""}, "baxis": {"gridcolor": "white", "linecolor": "white", "ticks": ""}, "bgcolor": "#E5ECF6", "caxis": {"gridcolor": "white", "linecolor": "white", "ticks": ""}}, "title": {"x": 0.05}, "xaxis": {"automargin": true, "gridcolor": "white", "linecolor": "white", "ticks": "", "zerolinecolor": "white", "zerolinewidth": 2}, "yaxis": {"automargin": true, "gridcolor": "white", "linecolor": "white", "ticks": "", "zerolinecolor": "white", "zerolinewidth": 2}}}, "width": 800, "xaxis": {"domain": [0.15, 1], "mirror": false, "rangemode": "tozero", "showgrid": false, "showline": false, "showticklabels": true, "tickmode": "array", "ticks": "", "ticktext": ["Agtrap", "Agt", "Cckar", "Cacna1b", "Cacna1e", "Cartpt", "Adrb1", "Calca", "Agtr1a", "Chrm4", "Adra1a", "Chrm2", "Calcrl", "Cck", "Cacna1g", "Camk2a", "Cebpa", "Cacna1i", "Agtr2", "Cebpb", "Cacna1h", "Cacna1a", "Cacna1c", "Cacna1d", "Chrm3", "Ar", "Cckbr", "Adra2a", "Cebpd"], "tickvals": [5.0, 15.0, 25.0, 35.0, 45.0, 55.0, 65.0, 75.0, 85.0, 95.0, 105.0, 115.0, 125.0, 135.0, 145.0, 155.0, 165.0, 175.0, 185.0, 195.0, 205.0, 215.0, 225.0, 235.0, 245.0, 255.0, 265.0, 275.0, 285.0], "type": "linear", "zeroline": false}, "xaxis2": {"domain": [0, 0.15], "mirror": false, "showgrid": false, "showline": false, "showticklabels": false, "ticks": "", "zeroline": false}, "yaxis": {"domain": [0, 0.85], "mirror": false, "rangemode": "tozero", "showgrid": false, "showline": false, "showticklabels": false, "ticks": "", "type": "linear", "zeroline": false}, "yaxis2": {"domain": [0.825, 0.975], "mirror": false, "showgrid": false, "showline": false, "showticklabels": false, "ticks": "", "zeroline": false}},
  {"responsive": true}
)
}

module.exports = exports = Plotsvy
