// plot_manager.js, manages the plot and its data
const Plotly = require('plotly.js/dist/plotly-basic.min.js')

function PlotManager(parentDiv) {
  var chartDiv = parentDiv.querySelector('#chart_div')
  var _this = this
  _this.plot = undefined

  this.createChart = function (createChartData, samplesPerSecond, id) {
    if (_this.plot !== undefined) {
      Plotly.purge(chartDiv)
    }
    _this.numberOfTraces = 0
    // _this.initialiseResizeListener(parentDiv)

    var times = []
    for (var i in createChartData) {
      times.push(i / samplesPerSecond)
    }

    var chartData = processData(createChartData, times, id)

    var chartOptions = {
      title: 'Selected Channels Plot ',
      xaxis: {
        type: 'seconds',
        title: 'Seconds'
      },
      yaxis: {
        autorange: true,
        type: 'linear',
        title: 'mV'
      }
    }
    _this.plot = Plotly.react(chartDiv, chartData, chartOptions)
  }

  this.resetChart = function () {
    if (_this.plot !== undefined) {
      Plotly.purge(chartDiv)
      _this.plot = undefined
      _this.numberOfTraces = 0
    }
  }

  this.clearChart = function () {
    if (_this.plot !== undefined) {
      Plotly.purge(chartDiv)
      _this.numberOfTraces = 0
    }
  }

  this.addDataSeriesToChart = function (newSeries, samplesPerSecond, id) {

    if (_this.plot === undefined){
      _this.createChart(newSeries, samplesPerSecond, id)
      return
    }

    var times = []
    for (var i in newSeries) {
      times.push(i / samplesPerSecond)
      window.times = times
    }
    var layout = {grid: {rows: _this.numberOfTraces, columns: 1, pattern: 'independent'}}
    _this.numberOfTraces += 1
    var newData = processData(newSeries, times, id)
    Plotly.addTraces(chartDiv, newData)
    Plotly.relayout(chartDiv, layout)
  }

  var processData = function (unprocessedData, times, id) {
    var dataTrace = {
      type: 'scatter',
      name: id,
      mode: 'lines',
      x: times,
      y: unprocessedData,
      line: {
        color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
      }
    }
    return [dataTrace]
  }

  this.resizePlot = function( width, height ){
    if (_this.plot === undefined){
      _this.plot = Plotly.react(chartDiv)
    }
    Plotly.relayout(chartDiv, {
      width: width,
      height: height
    })
  }

  this.initialiseResizeListener = function (resizeObject) {
    resizeObject.addEventListener('resize', _ => {
      Plotly.relayout(chartDiv, {
        width: resizeObject.innerWidth - 30,
        height: resizeObject.innerHeight - 50
      })
    })
  }
}

module.exports = PlotManager
