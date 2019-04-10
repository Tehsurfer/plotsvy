// plot_manager.js, manages the plot and its data
const Plotly = require('plotly.js/dist/plotly-basic.min.js')

function PlotManager() {
  var parentDiv = document.getElementById('blackfynn-panel')
  var chartDiv = parentDiv.querySelector('#chart_div')
  var self = this
  self.plot = undefined

  this.createChart = function (createChartData, id) {
    if (self.plot !== undefined) {
      Plotly.purge(chartDiv)
    }
    chartDiv.style.height = '700px'

    var times = []
    for (var i in createChartData) {
      times.push(i)
    }

    var chartData = processData(createChartData, times, id)

    var chartOptions = {
      title: 'Selected Channels Plot ',
      xaxis: {
        type: 'milliseconds',
        title: 'Milliseconds'
      },
      yaxis: {
        autorange: true,
        type: 'linear',
        title: 'mV'
      }
    }
    self.plot = Plotly.react(chartDiv, chartData, chartOptions)
  }

  this.resetChart = function () {
    if (self.plot !== undefined) {
      Plotly.purge(chartDiv)
      self.plot = undefined
    }
  }

  this.clearChart = function () {
    if (self.plot !== undefined) {
      Plotly.purge(chartDiv)
    }
  }

  this.addDataSeriesToChart = function (newSeries, id) {
    var newData = processData(newSeries, id)
    Plotly.addTraces(chartDiv, newData)
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
}

module.exports = PlotManager
