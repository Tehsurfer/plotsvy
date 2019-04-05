/**
* BlackfynnPanel is used for making calls to blackfynn to collect timeseries data and plot it using plotly
*/

require('.././node_modules/select2/dist/css/select2.min.css')
require('.././css/main.css')
require('.././css/util.css')
const UI = require('./ui.js')
var ui = new UI()

// dat.gui container for cellGui
var $ = require('jquery')
var Plotly = require('plotly')
require('select2')

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

  blackfynnManger.initialiseBlackfynnPanel()
})

function BlackfynnManager () {
  var self = this
  self.plot = undefined
  self.baseURL = 'https://blackfynnpythonlink.ml/'

  this.initialiseBlackfynnPanel = function () {
    $('.datasetUI').hide('fast')
    self.createOpenCORlink()
    document.getElementById('login').onclick = self.login
    document.getElementById('login_switch').onclick = ui.loginSwitch
    document.getElementById('logout_button').onclick = self.logout
    self.checkForSessionToken()
  }

  this.apiKeyLogin = function (apiKey, apiSecret) {
    self.createAuthToken(self.baseURL, apiKey, apiSecret, function authCallBack(response) {
      self.datasets = response
      ui.createDatasetDropdown(response.names)
      self.channelNamesCall(response.names[0])
    })
    document.getElementById('select_dataset').onchange = self.datasetCall
    document.getElementById('select_channel').onchange = self.channelCall
    ui.hideLogin()
    self.channelCall()
  }

  this.createAuthToken = function (baseRestURL, apiKey, apiSecret, callback) {
    var APIPath = '/api/get_timeseries_dataset_names'
    var completeRestURL = baseRestURL + APIPath
    console.log('REST API URL: ' + completeRestURL)

    var method = 'POST'
    var postData = '{"tokenId": "' + apiKey + '","secret": "' + apiSecret + '","loginMode": 1,"applicationType": 35}'
    var url = completeRestURL
    var async = true
    var request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState == 4 && (request.status == 200 || request.status == 201)) {
        console.log('ONLOAD')
        var status = request.status // HTTP response status, e.g., 200 for "200 OK"
        console.log(status)
        var response = JSON.parse(request.responseText)
        console.log(response)
        return callback(response)
      }
    }

    request.open(method, url, async)
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader('Accept', 'application/json')
    request.send(postData)
  }

  // datasetCall retrieves the names of abailable datasets/
  this.datasetCall = function (dataset) {
    var headerNames = ['name', 'Channel']
    var headerValues = [$('#select_dataset :selected').text(), 'dataset_name']
    var APIPath = '/api/get_channel_data'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      self.resetChart()
      self.channelNamesCall($('#select_dataset :selected').text())
    })
  }

  // channelNames call sends channel names to createDatasetDropdown to create the dropdown selection
  this.channelNamesCall = function (dataset) {
    var headerNames = ['Name']
    var headerValues = [dataset]
    var APIPath = '/api/get_channels'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      ui.createChannelDropdown(response.data)
      self.channelCall()
    })
  }

  this.channelCall = function () {
    var headerNames = ['Name', 'Channel']
    var headerValues = [$('#select_dataset :selected').text(), $('#select_channel :selected').text()]
    var APIPath = '/api/get_channel'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var data = JSON.parse(response.data)
      if (self.plot !== undefined) {
        self.addDataSeriesToChart(data, $('#select_channel :selected').text())
      } else {
        self.createChart(data, $('#select_channel :selected').text())
        // document.getElementById('chartLoadingGif').remove();
      }
    })
  }

  this.resetChart = function () {
    if (self.plot !== undefined) {
      Plotly.purge('chart_div')
      self.plot = undefined
    }
  }

  this.createChart = function (createChartData, id) {
    if (self.plot !== undefined) {
      Plotly.purge('chart_div')
    }
    document.getElementById('chart_div').style.height = '700px'

    var times = []
    for (var i in createChartData) {
      times.push(i)
    }

    var chartData = self.processData(createChartData, times, id)

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
    self.plot = Plotly.newPlot('chart_div', chartData, chartOptions)
  }

  this.addDataSeriesToChart = function (newSeries, id) {
    var newData = self.processData(newSeries, id)
    Plotly.addTraces('chart_div', newData)
  }

  this.processData = function (unprocessedData, times, id) {
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

  this.logout = function () {
    localStorage.clear()
    $('.datasetUI').hide('slow')
    $('.container-login100').show('slow')
    if (self.plot !== undefined) {
      Plotly.purge('chart_div')
    }
    document.body.scrollTop = document.documentElement.scrollTop = 0
  }

  this.checkForSessionToken = function () {
    const token = localStorage.getItem('auth_token')
    if (token) {
      self.checkSession(token, response => {
        if (response.status === 'success') {
          self.apiKeyLogin(response.data.api_token, response.data.api_secret)
        }
      })
    }
  }

  this.createOpenCORlink = function () {
    var runModelButton = document.getElementById('OpenCORLinkButton')
    runModelButton.onclick = self.runModel

    var exportCSVButton = document.getElementById('csvExportButton')
    exportCSVButton.onclick = self.exportCSV
  }

  this.runModel = function () {
    var headerNames = ['unused']
    var headerValues = ['unused']
    var APIPath = '/api/create_openCOR_URL'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var urlPrefix = 'opencor://importFile/'
      window.open(urlPrefix + response.url, '_self')
      document.getElementById('exportURL').innerHTML = 'File is being stored at: ' + response.url
    })
  }

  this.exportCSV = function () {
    var headerNames = ['unused']
    var headerValues = ['unused']
    var APIPath = '/api/create_openCOR_URL'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var urlPrefix = ''
      window.open(urlPrefix + response.url, '_self')
      document.getElementById('exportURL').innerHTML = 'File is being stored at: ' + response.url
    })
  }

  this.login = function () {
    ui.showApp()
    if (document.getElementById('login_switch').innerHTML === 'Email/Password') {
      if (document.getElementById('ckb1').checked) {
        self.createSessionFromKeys(self.baseURL, response => {
          localStorage.setItem('auth_token', response.auth_token)
        })
      }
      self.apiKeyLogin(document.getElementById('api_key').value, document.getElementById('secret').value)
    } else {
      self.emailLogin()
    }
  }

  this.emailLogin = function () {
    self.emailLoginPostRequest(self.baseURL, response => {
      if (document.getElementById('ckb1').checked) {
        localStorage.setItem('auth_token', response.auth_token)
      }
      self.apiKeyLogin(response.api_token, response.api_secret)
    })
  }

  this.emailLoginPostRequest = function (baseRestURL, callback) {
    var APIPath = '/api2/auth/register'
    var completeRestURL = baseRestURL + APIPath
    console.log('REST API URL: ' + completeRestURL)
    var method = 'POST'
    var postData = '{"email": "' + document.getElementById('api_key').value + '","password": "' + document.getElementById('secret').value + '","loginMode": 1,"applicationType": 35}'
    var url = completeRestURL
    var async = true

    var request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState == 4 && (request.status == 200 || request.status == 201)) {
        console.log('ONLOAD')
        var status = request.status // HTTP response status, e.g., 200 for "200 OK"
        console.log(status)
        var response = JSON.parse(request.responseText)
        console.log(response)
        return callback(response)
      }
    }
    request.open(method, url, async)
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader('Accept', 'application/json')
    request.send(postData)
  }

  this.createSessionFromKeys = function (baseRestURL, callback) {
    var APIPath = '/api2/auth/keys'
    var completeRestURL = baseRestURL + APIPath
    console.log('REST API URL: ' + completeRestURL)
    var method = 'POST'
    var postData = '{"api_token": "' + document.getElementById('api_key').value + '","api_secret": "' + document.getElementById('secret').value + '","loginMode": 1,"applicationType": 35}'
    var url = completeRestURL
    var async = true

    var request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState == 4 && (request.status == 200 || request.status == 201)) {
        console.log('ONLOAD')
        var status = request.status // HTTP response status, e.g., 200 for "200 OK"
        console.log(status)
        var response = JSON.parse(request.responseText)
        console.log(response)
        return callback(response)
      }
    }
    request.open(method, url, async)
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader('Accept', 'application/json')
    request.send(postData)
  }

  this.checkSession = function (sessionToken, callback) {
    var APIPath = '/api2/auth/check'
    var completeRestURL = self.baseURL + APIPath
    console.log('REST API URL: ' + completeRestURL)
    const authorization = 'Bearer ' + sessionToken
    var method = 'POST'
    var postData = '{"Authorization": "' + authorization + '","loginMode": 1,"applicationType": 35}'
    var url = completeRestURL
    var async = true
    var request = new XMLHttpRequest()
    request.onreadystatechange = function () {
      if (request.readyState == 4 && (request.status == 200 || request.status == 201)) {
        console.log('ONLOAD')
        var status = request.status // HTTP response status, e.g., 200 for "200 OK"
        console.log(status)
        var response = JSON.parse(request.responseText)
        console.log(response)
        return callback(response)
      }
    }
    request.open(method, url, async)
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader('Accept', 'application/json')
    request.send(postData)
  }
}
function getRequest (baseRestURL, APIPath, headerNames, headerValues, callback) {
  var completeRestURL = baseRestURL + APIPath
  console.log('REST API URL: ' + completeRestURL)
  var method = 'GET'
  var url = completeRestURL
  var async = true
  var request2 = new XMLHttpRequest()
  request2.onload = function () {
    console.log('ONLOAD')
    var status = request2.status // HTTP response status, e.g., 200 for "200 OK"
    console.log(status)
    var response = JSON.parse(request2.responseText)
    return callback(response)
  }

  request2.open(method, url, async)
  for (var i in headerNames) {
    request2.setRequestHeader(headerNames[i], headerValues[i])
  }
  request2.send(null)
}

var blackfynnManger = new BlackfynnManager()

