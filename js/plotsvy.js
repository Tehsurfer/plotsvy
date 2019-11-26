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
class Plotsvy {
  constructor(targetDiv, inputURL) {
    var ui = undefined
    var parentDiv = undefined
    var plot = undefined
    var csv = undefined
    var state = undefined
    var fileNav = undefined
    var dirString = 'directory-meta'
    var bc = new BroadcastChannel.default('plot_channel') // For updating other web apps working with Plotsvy

    var datguiTimeseriesFunctions = {
      'Export as CSV': () => this.csv.export(this.state),
      'Open in OpenCOR': () => this.csv.exportForOpenCOR(this.state),
      'Show All': () => this.plotAll(),
      'Hide All': () => this.hideAll(),
      'Switch Axes': () => this.switchAxes()
    }
  
    var datguiStaticFunctions = {
      'Export as CSV': () => this.csv.export(this.state),
      'Open in OpenCOR': () => this.csv.exportForOpenCOR(this.state),
      'Show All': () => this.plotAll(),
      'Hide All': () => this.hideAll(),
      'Switch Axes': () => this.switchAxes(),
      'Plot as Heatmap': () => this.heatMapPlotSwitch()
    }

    // If targetDiv is not provided, we will assume it already exists (this is used for the demo)
    if (targetDiv === null || targetDiv === undefined) {
      this.parentDiv = document.getElementById('plotsvy-example-panel')
    } else {
      this.parentDiv = targetDiv
    }
    this.initialise()
  } 


  // initialise: Sets up ui and plot, requires DOM to be loaded (Note: Called on construction)
  initialise(overRideUrl) {
    this.parentDiv.append(htmlToElement(plotsvy_html))
    var chartDiv = this.parentDiv.querySelector('#chart_div')
    this.ui = new UI(this.parentDiv)
    this.plot = new PlotManager(chartDiv)
    this.csv = new CsvManager()
    this.state = new StateManager(this.parentDiv)


    // Check if we have have a URL yet
    if (overRideUrl !== undefined){
      this.openInputUrl(inputURL)
    } else if (inputURL !== undefined){
      this.openInputUrl(inputURL)
    }
  }

  // openInputUrl: Opens url in directory or single file mode based on urlstring
  openInputUrl(url){

    // Multi File
    if (url.includes(dirString)){ 
      this.ui.showLoadingGif()
      this.ui.showDirectoryContent()
      this.createFileNavigation(url).then( _=>{
        this.ui.hideLoadingGif()
      })
    
    // Single File
    } else { 
      this.ui.showLoadingGif()
      this.ui.hideDirectoryContent()
      this.openCSV(url).then(this.ui.hideLoadingGif)
    }
  }

  openBroadcastChannel (name) {
    bc.close()
    bc = new BroadcastChannel.default(name)
  }

  sendChannelMessage (message) {
    bc.postMessage(message)
  }

  // csvChannelCall: Adds a trace to the plot from 'select_channel' div
  csvChannelCall () {
    var selectedChannel = this.parentDiv.querySelector('#select_channel').textContent
    this.plot.addDataSeriesToChart(this.csv.getColoumnByName(selectedChannel), this.csv.getColoumnByIndex(0), selectedChannel)
    this.state.selectedChannels.push(selectedChannel)
    bc.postMessage({ 'state': this.exportStateAsString() })
  }

  // checkBoxCall: Function to pass to dat.gui to add trace to plot
  checkBoxCall (channel, index, flag) {
    if (!flag) { // Flag lets us know if checkbox was checked before this click
      this.plot.addDataSeriesFromDatGui(this.csv.getColoumnByIndex(index), this.csv.getColoumnByIndex(0), channel, index)
      this.state.selectedChannels.push(channel)
    }
    else {
      this.plot.removeSeries(index)
      ch_ind = this.state.selectedChannels.indexOf(channel)
      this.state.selectedChannels.splice(ch_ind, ch_ind + 1) // Removes channel index
    }
    bc.postMessage({ 'state': this.exportStateAsString() })
  }


  openCSV (url) {
    return new Promise(function (resolve, reject) {
      this.clearChart()
      this.ui.showLoadingGif()
      this.csv.loadFile(url).then(_ => {
        this.ui.setTitle(this.csv.getTitle(url))
        setup()
        this.state.csvURL = url
        setTimeout(() => bc.postMessage({ 'state': this.exportStateAsString() }), 800)
        this.ui.hideLoadingGif()
        this.parentDiv.querySelectorAll('.multi-file')[1].style.display = 'none'
        if(fileNav !== undefined){
          // fileNav.collapseAll()
        }
        resolve()
      })
    })
  }

  openCSVfromState (url) {
    return new Promise(function (resolve, reject) {
      this.ui.showLoadingGif()
      if (url === undefined) {
        console.log('Error! Not loading any data into chart!')
        reject()
      }
      this.csv.loadFile(url).then(_ => {
        this.ui.setTitle(this.csv.getTitle(url))
        setup()
        this.ui.hideLoadingGif()
        resolve()
      })
    })
  }

  // setup: Creates different UI's depending on type of data and plots data depending on state.plotall 
  setup () {
    this.plot.setXaxisLabel(this.csv.getXaxis())
    this.setDataType(this.csv.getDataType())
    this.ui.showSelector()
    
    var headers = [...this.csv.getHeaders()]
    headers.shift()
    if (this.state.plotAll) {
      this.plotAll()
    } else {

      // Check which functions we need for datgui
      var datguiFunctions = datguiStaticFunctions
      if (this.csv.getDataType() === 'scatter'){
        datguiFunctions = datguiTimeseriesFunctions
      }

      // Dat.gui UI
      if (headers.length < 100) {
        this.ui.buildDatGui(datguiFunctions)
        this.ui.createDatGuiDropdown(headers, checkBoxCall)
      } 

      // Select2 UI for navigating large amounts of headers
      else { 
        this.ui.createSelectDropdown(headers)
        this.parentDiv.querySelector('#select_channel').onchange = csvChannelCall
        this.ui.buildDatGui(datguiFunctions)
      }
      if (!this.state.plotAll && this.state.selectedChannels.length === 0) {
        this.plotByIndex(1)
        setTimeout(this.updateSize, 500)
      }
    }
  }

  // createFileNavigation: Uses a meta-data url to create navigation
  createFileNavigation(url){
    return new Promise(function(resolve, reject){
      var fileNavDiv = this.parentDiv.querySelector('#file_nav')
      fileNav = new FileManager(fileNavDiv, url, this.openCSV)
      resolve()
    })
  }

  plotAll () {
    this.plot.plotAll(this.csv.getAllData()) // plot all
    this.ui.hideSelector()
    if (this.csv.getHeaders().length < 100) {
      for (let i in this.ui.checkboxElements) {
        this.ui.checkboxElements[i].__checkbox.checked = true // update dat.gui
      }
    }
    setTimeout(this.updateSize, 1000)
    this.state.plotAll = true
  }

  hideAll () {
    this.clearChart()
    if (this.csv.getHeaders().length > 100) {
      this.ui.showSelector()
    } 
    setTimeout(this.updateSize, 1000)
    this.state.plotAll = false
  }


  plotByIndex (index) {
    var channelName = this.csv.getHeaderByIndex(index)
    this.plot.addDataSeriesToChart(this.csv.getColoumnByIndex(index), this.csv.getColoumnByIndex(0), channelName)
    this.state.selectedChannels.push(channelName)
  }

  plotByNamePromise (channelName) {
    return new Promise(function (resolve, reject) {
      searchResult = this.csv.getColoumnByName(channelName)
      if (searchResult === false){
        console.log('Could not find channel: "'+ channelName +'" in the loaded csv file')
        reject()
      } else {
        this.plot.addDataSeriesToChart(searchResult, this.csv.getColoumnByIndex(0), channelName)
        resolve()
      }
    })
  }

  plotByName (channelName) {
    searchResult = this.csv.getColoumnByName(channelName)
    if (searchResult === false){
      console.log('Could not find channel: "'+ channelName +'" in the loaded csv file')
      return false
    }
    this.plot.addDataSeriesToChart(searchResult, this.csv.getColoumnByIndex(0), channelName)
    this.state.selectedChannels.push(channelName)
  }

  exportStateAsString () {
    return JSON.stringify(this.state)
  }

  exportState () {
    return this.state
  }

  setDataType (dataType) {
    this.plot.plotType = dataType
    this.state.plotType = dataType
    this.ui.dataType = dataType
  }

  loadState (jsonString) {
    return new Promise(function (resolve, reject) {
      this.clearChart()
      this.state.loadFromJSON(jsonString)
      openCSVfromState(this.state.csvURL).then(_ => {
        this.plot.plotType = this.state.plotType
        if (this.state.selectedChannels !== undefined) {
          if (this.state.selectedChannels.length > 0) {
            if (!this.state.plotAll) {
              plotStateChannels(this.state.selectedChannels)
            }
          }
        }

        resolve()
      })
    })
  }

  plotStateChannels (channels) {
    if (Array.isArray(channels) === false){ //check if channels is string
      this.plotByNamePromise(channels)
      this.state.selectedChannels = [this.state.selectedChannels] //if channels aren't in array make one
    } else {
      this.plotByNamePromise(channels[0]).then(_ => { //allow first plot to finish
        for (let i = 0; i < channels.length; i++) {
          if (i === 0) {
            continue
          }
          this.plotByNamePromise(channels[i]) //add remaining channels
        }
      })
      // Update dat gui via search
      for (let i in channels) {
        for (let j in this.ui.checkboxElements) {
          if (this.ui.checkboxElements[j].property === channels[i]) {
            this.ui.checkboxElements[j].__checkbox.checked = true
            break
          }
        }
      }
    }
  }

  clearChart () {
    this.plot.resetChart()
    this.state.selectedChannels = []
  }

  switchAxes () {
    this.clearChart()
    this.csv.transposeSelf()
    setup()
  }

  exportCSV () {
    this.csv.export(this.state)
  }

  exportToOpenCOR () {
    this.csv.exportToOpenCOR(this.state)
  }


  heatMapPlotSwitch() {
    if (this.state.plotType === 'bar'){
      this.heatMapPlot()
      this.state.plotType = 'heatmap'
    } else {
      this.plot.resetChart()
      this.plotByIndex(1)
      this.state.plotType = 'bar'
    }
    this.ui.switchBarHeatmapButton()
  }

  heatMapPlot(){
    var nested_rows = this.csv.getAllData()
    var y_headers = this.csv.getHeaders()
    var x_headers = this.csv.getColoumnByIndex(0)
    y_headers.shift()
    x_headers.shift()
    this.plot.heatMapPlot(nested_rows, x_headers, y_headers)
  }

  updateSize () {
    var dataset_div = this.parentDiv.querySelector('#dataset_div')
    var chart_height = this.parentDiv.clientHeight - dataset_div.offsetHeight
    this.plot.resizePlot(this.parentDiv.clientWidth, chart_height)
  }
}

htmlToElement = (html) => {
  let template = document.createElement('template')
  html = html.trim() // Never return a text node of whitespace as the result
  template.innerHTML = html
  return template.content.firstChild
}

module.exports = exports = Plotsvy
