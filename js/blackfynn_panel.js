/**
* BlackfynnPanel is used for making calls to blackfynn to collect timeseries data and plot it using plotly
*/

require('.././node_modules/select2/dist/css/select2.min.css')
require('.././css/main.css')
require('.././css/util.css')
const UI = require('./ui.js')
const PlotManager = require('./plot_manager.js')
var $ = require('jquery')
require('select2')

// Need to load select2 and blackfynnManger once the DOM is ready
$(document).ready(function () {
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

  blackfynnManager.initialiseBlackfynnPanel()
})


// BlackfynnManager(): Manages the HTTP requests to the backend, Tehsurfer/Physiome-Blackfynn-API 
//                     and drives the plot and ui modules.
function BlackfynnManager() {
  var ui = undefined
  var parentDiv = undefined
  var plot = undefined
  var self = this
  var loggedIn = false
  self.baseURL = 'http://127.0.0.1:82/'

  // initialiseBlackfynnPanel: sets up ui and plot, needs DOM to be loaded
  this.initialiseBlackfynnPanel = function () {
    ui = new UI()
    plot = new PlotManager()
    parentDiv = document.getElementById('blackfynn-panel')

    self.examplePlotSetup()
    parentDiv.querySelector('#select_channel').onchange = channelCall


  }

  this.examplePlotSetup = function(){
    channelNames = ['one', 'two', 'three']
    ui.createChannelDropdown(channelNames)
    data = [1,2,3,4]
    samplesPerSecond = 1
    plot.createChart(data, samplesPerSecond, data.length, channelNames[0])
  }

  channelCall = function(){
    selectedChannel = $('#select_channel :selected').text()
    data = {
      'one': [1,2,3,4],
      'two': [2,2,3,4],
      'three': [3,2,3,4]
    }
    samplesPerSecond = 1

    plot.addDataSeriesToChart(data[selectedChannel], samplesPerSecond, selectedChannel)

  }
}

var blackfynnManager = new BlackfynnManager()

window.blackfynnManager = blackfynnManager
