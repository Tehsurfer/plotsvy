/**
* BlackfynnPanel is used for making calls to blackfynn to collect timeseries data and plot it using plotly
*/

require('.././node_modules/select2/dist/css/select2.min.css')
require('.././css/main.css')
require('.././css/util.css')
const UI = require('./ui.js')
const PlotManager = require('./plot_manager.js')
const CsvManager = require('./csv_manager.js')
const StateManager = require('./state_manager.js')
const BroadcastChannel = require('broadcast-channel')
var $ = require('jquery')
require('select2')


// Need to load select2 and blackfynnManger once the DOM is ready
// $(document).ready(function () {

// })


// BlackfynnManager(): Manages the HTTP requests to the backend, Tehsurfer/Physiome-Blackfynn-API 
//                     and drives the plot and ui modules.
function BlackfynnManager() {
  var ui = undefined
  var parentDiv = undefined
  var plot = undefined
  var csv = undefined
  var state = undefined
  var _this = this
  var loggedIn = false
  var multiplot = false
  var bc = new BroadcastChannel.default('plot_channel')
  _this.plot = plot
  
  

  // initialiseBlackfynnPanel: sets up ui and plot, needs DOM to be loaded
  this.initialiseBlackfynnPanel = function () {
    parentDiv = document.getElementById('blackfynn-panel')
    ui = new UI(parentDiv)
    plot = new PlotManager(parentDiv)
    csv = new CsvManager()
    state = new StateManager(parentDiv)
  }

  this.openBroadcastChannel = function(name){
    bc.close()
    bc = new BroadcastChannel.default(name)
  }

  var sendChannelMessage = function(message){
    bc.postMessage(message)
  }

  this.examplePlotSetup = function(){
    parentDiv.querySelector('#select_channel').onchange = testChannelCall
    var channelNames = ['one', 'two', 'three']
    ui.createChannelDropdown(channelNames)
    var data = [1,2,3,4]
    var samplesPerSecond = 1
    plot.createChart(data, samplesPerSecond, data.length, channelNames[0])
  }

  var testChannelCall = function(){
    selectedChannel = $('#select_channel :selected').text()
    data = {
      'one': [1,2,3,4],
      'two': [2,2,3,4],
      'three': [3,2,3,4]
    }
    samplesPerSecond = 1

    plot.addDataSeriesToChart(data[selectedChannel], samplesPerSecond, selectedChannel)

  }

  var csvChannelCall = function(){
    var selectedChannel = $('#select_channel :selected').text()
    plot.addDataSeriesToChart(csv.getColoumnByName(selectedChannel), csv.getSampleRate(), selectedChannel)
    state.selectedChannels.push(selectedChannel)
    bc.postMessage({'state': _this.exportStateAsString()})
  }


  this.openCSV = function(url){
    return new Promise(function(resolve, reject){
      csv.loadFile(url, ()=>{
        ui.showSelector()
        ui.createChannelDropdown(csv.getHeaders())
        parentDiv.querySelector('#select_channel').onchange = csvChannelCall
        state.setURL(url)
        resolve()
      })
    })
  }

  this.plotAll = function(){
    plot.plotAll(csv.getAllData())
    ui.hideSelector()
    _this.updateSize()   
  }

  this.setSubplotsFlag = function(flag){
    plot.subplots = flag  
  }

  this.plotByIndex = function(index){
    var channelName = csv.getHeaderByIndex(index)
    plot.addDataSeriesToChart(csv.getColoumnByIndex(index), csv.getSampleRate(), channelName)
    state.selectedChannels.push(channelName)
  }

  this.plotByName = function(channelName){
    plot.addDataSeriesToChart(csv.getColoumnByName(channelName), csv.getSampleRate(), channelName)
    state.selectedChannels.push(channelName)
  }

  this.clearChart = function(){
    plot.clearChart()
  }

  this.exportStateAsString = function(){
    return JSON.stringify(state)
  }

  this.exportState = function(){
    return state
  }



  this.loadState = function(jsonString){
    return new Promise(function(resolve, reject){
      plot.clearChart()
      state.loadFromJSON(jsonString)
      _this.openCSV(state.csvURL).then( _ => {
        plot.subplots = state.subplots
        if (state.plotAll) {
          _this.plotAll()
        } else {
          ui.showSelector()
          for (i in state.selectedChannels){
            _this.plotByName(state.selectedChannels[i])
          }
        }
      })
      resolve()
    })
    
  }


  var initialiseObject = function(){
    $('.js-select2').each(function () {
      $(this).select2({
        minimumResultsForSearch: 20
      })
      $('.js-select2').each(function () {
        $(this).on('select2:close', function (e) {
          $('.js-show-service').slideUp()
          $('.js-show-service').slideDown()
        })
      })
    })
  
    _this.initialiseBlackfynnPanel()
  }

  this.updateSize = function(){
    var blackfynn_panel = document.getElementById('blackfynn-panel')
    var dataset_div = document.getElementById('dataset_div')
    var chart_height = blackfynn_panel.clientHeight - dataset_div.offsetHeight

    plot.resizePlot(blackfynn_panel.clientWidth, chart_height)
  }
  initialiseObject()

}

exports.BlackfynnManager = BlackfynnManager