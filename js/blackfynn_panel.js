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

  blackfynnManger.initialiseBlackfynnPanel()
})


// BlackfynnManager(): Manages the HTTP requests to the backend, Tehsurfer/Physiome-Blackfynn-API 
//                     and drives the plot and ui modules.
function BlackfynnManager() {
  var ui = undefined
  var parentDiv = undefined
  var plot = undefined
  var self = this
  var loggedIn = false
  self.baseURL = 'https://blackfynnpythonlink.ml'

  // initialiseBlackfynnPanel: sets up ui and plot, needs DOM to be loaded
  this.initialiseBlackfynnPanel = function () {
    ui = new UI()
    plot = new PlotManager()
    parentDiv = document.getElementById('blackfynn-panel')
    self.initialiseExportLinks()
    parentDiv.querySelector('#login').onclick = () => self.login(ui.hideLogin)
    parentDiv.querySelector('#login_switch').onclick = ui.loginMethodSwitch
    parentDiv.querySelector('#logout_button').onclick = self.logout
    checkForSessionToken()
  }

  // this.insert : Inserts a channel into plot when the plot is ready
  //    package : name or id of package, aka file name.
  //    channel : namer or id of channel.
  // *note* If the function is used before self.login() then the function will wait for login before 
  //  adding the channel
  this.insert = function (packageName, channel) {
    if (loggedIn === false) {
      self.loginWait = setInterval(_ => {
        if (loggedIn === true) {
          loggedInCallback(packageName, channel)
        }
      }, 1000)
    } else {
      self.datasetCallFor(packageName, _ => {
        self.channelCallFor(packageName, channel)
      })
    }
  }

  // loggedInCallback: resolves the setInterval() waiting for login
  var loggedInCallback = function (packageName, channel) {
    console.log('login resolved')
    clearInterval(self.loginWait)
    self.datasetCallFor(packageName, _ => {
      self.channelCallFor(packageName, channel)
    })
  }


  //  checkForSessionToken : Checks if user has a temporary auth token to retrieve blackfynn keys with
  var checkForSessionToken = async function () {
    const token = localStorage.getItem('auth_token')
    if (token) {
      checkSession(token, async(response) => {
        if (response.status === 'success') {
          apiKeyLogin(response.data.api_token, response.data.api_secret)
        }
      })
    }
  }

  // this.login: calls email or API key login based off the email/apikeys UI switch
  this.login = async function (callback) {
    if (parentDiv.querySelector('#login_switch').innerHTML === 'Email/Password') {
      if (parentDiv.querySelector('#ckb1').checked) {
        createSessionFromKeys(self.baseURL, response => {
          localStorage.setItem('auth_token', response.auth_token)
        })
      }
      apiKeyLogin(parentDiv.querySelector('#api_key').value, parentDiv.querySelector('#secret').value)
    } else {
      emailLogin()
    }
  }

  // apiKeyLogin : Uses apiKey and apiSecret to login to Blackfynn
  async function apiKeyLogin (apiKey, apiSecret) {
    await getDatsetsForKey(self.baseURL, apiKey, apiSecret, async (response) => {
      if (response.status == 200) {
        ui.hideLogin()
        ui.createDatasetDropdown(response.names)
        self.channelNamesCall(response.names[0])
        parentDiv.querySelector('#select_dataset').onchange = datasetCall
        parentDiv.querySelector('#select_channel').onchange = channelCall
      }
    })
  }

  // getDatsetsForKey : Makes http request to create auth token given API keys
  var getDatsetsForKey = async function (baseRestURL, apiKey, apiSecret, callback) {
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
        response.status = status
        console.log(response)
        return callback(response)
      }
    }

    request.open(method, url, async)
    request.setRequestHeader('Content-Type', 'application/json')
    request.setRequestHeader('Accept', 'application/json')
    request.send(postData)
  }

  // emailLogin : retrieves keys created from email in backend to use for accessing Blackfynn
  var emailLogin = async function () {
    emailLoginPostRequest(self.baseURL, async (response) => {
      if (parentDiv.querySelector('#ckb1').checked) {
        localStorage.setItem('auth_token', response.auth_token)
      }
      apiKeyLogin(response.api_token, response.api_secret)
    })
  }

  // emailLoginPostRequest : http request creating/retrieving keys from email and password
  var emailLoginPostRequest = async function (baseRestURL, callback) {
    var APIPath = '/api2/auth/register'
    var completeRestURL = baseRestURL + APIPath
    console.log('REST API URL: ' + completeRestURL)
    var method = 'POST'
    var postData = '{"email": "' + parentDiv.querySelector('#api_key').value + '","password": "' + parentDiv.querySelector('#secret').value + '","loginMode": 1,"applicationType": 35}'
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

  // createSessionFromKeys : Creates an auth token given a set of API keys to connect with backend
  var createSessionFromKeys = function (baseRestURL, callback) {
    var APIPath = '/api2/auth/keys'
    var completeRestURL = baseRestURL + APIPath
    console.log('REST API URL: ' + completeRestURL)
    var method = 'POST'
    var postData = '{"api_token": "' + parentDiv.querySelector('#api_key').value + '","api_secret": "' + parentDiv.querySelector('#secret').value + '","loginMode": 1,"applicationType": 35}'
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

  // checkSession : http request to check if auth_token is valid and return API keys to use if so
  var checkSession = function (sessionToken, callback) {
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

  // datasetCall retrieves the names of abailable datasets/
  var datasetCall = function () {
    var headerNames = ['name', 'Channel']
    var headerValues = [$('#select_dataset :selected').text(), 'dataset_name']
    var APIPath = '/api/get_channel_data'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      plot.resetChart()
      self.channelNamesCall($('#select_dataset :selected').text())
    })
  }

  // datasetCallFor : Used to switch the backend to the correct dataset
  this.datasetCallFor = function (dataset, callback) {
    var headerNames = ['name', 'Channel']
    var headerValues = [dataset, 'dataset_name']
    var APIPath = '/api/get_channel_data'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      self.channelNamesCall(dataset)
    })
    callback()
  }

  // channelNames : retreives channel names then sends to createDatasetDropdown to create the dropdown selection
  this.channelNamesCall = function (dataset) {
    var headerNames = ['Name']
    var headerValues = [dataset]
    var APIPath = '/api/get_channels'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      ui.createChannelDropdown(response.data)
      loggedIn = true
    })
  }

  // channelCall : retrieves data for a channel and plots it
  var channelCall = function () {
    var headerNames = ['Name', 'Channel', 'Length']
    var inputLegth = inputParse(parentDiv.querySelector('#lengthInput').value)
    var headerValues = [$('#select_dataset :selected').text(), $('#select_channel :selected').text(), inputLegth]
    var APIPath = '/api/get_channel'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var data = JSON.parse(response.data)
      if (plot.plot !== undefined) {
        plot.addDataSeriesToChart(data, $('#select_channel :selected').text())
      } else {
        plot.createChart(data, $('#select_channel :selected').text())
        // parentDiv.querySelector('#chartLoadingGif').remove();
      }
    })
  }

  // this.channelCallFor : retrieves data for a parameter defined dataset and channel
  this.channelCallFor = function (dataset, channel) {
    var headerNames = ['Name', 'Channel']
    var headerValues = [dataset, channel]
    var APIPath = '/api/get_channel'

    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var data = JSON.parse(response.data)
      if (plot.plot !== undefined) {
        plot.addDataSeriesToChart(data, channel)
      } else {
        plot.createChart(data, channel)
        // parentDiv.querySelector('#chartLoadingGif').remove();
      }
    })
  }

  // logout : Clears auth token and switches to login 
  this.logout = function () {
    localStorage.clear()
    ui.showLogin()
    plot.clearChart()
    document.body.scrollTop = document.documentElement.scrollTop = 0
  }

  // initialiseExportLinks : initialises export buttons
  this.initialiseExportLinks = function () {
    var runModelButton = parentDiv.querySelector('#OpenCORLinkButton')
    runModelButton.onclick = runModel

    var exportCSVButton = parentDiv.querySelector('#csvExportButton')
    exportCSVButton.onclick = exportCSV
  }

  // runModel : Opens the exports in OpenCOR
  var runModel = function () {
    var headerNames = ['unused']
    var headerValues = ['unused']
    var APIPath = '/api/create_openCOR_URL'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var urlPrefix = 'opencor://importFile/'
      window.open(urlPrefix + response.url, '_self')
      parentDiv.querySelector('#exportURL').innerHTML = 'File is being stored at: ' + response.url
    })
  }

  // exportCSV : saves data as csv file
  var exportCSV = function () {
    var headerNames = ['unused']
    var headerValues = ['unused']
    var APIPath = '/api/create_openCOR_URL'
    getRequest(self.baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
      var urlPrefix = ''
      window.open(urlPrefix + response.url, '_self')
      parentDiv.querySelector('#exportURL').innerHTML = 'File is being stored at: ' + response.url
    })
  }

  function getRequest(baseRestURL, APIPath, headerNames, headerValues, callback) {
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
}

function inputParse (input) {
  var numericVal = input.replace(/[^\d.]/g, '')
  if (numericVal.length === 0) {
    return '1s'
  }
  var indexMinutes = input.indexOf('m')
  if (indexMinutes > input.length - 3) {
    return numericVal + 'm'
  } else {
    return numericVal + 's'
  }
}

var blackfynnManager = new BlackfynnManager()

window.blackfynnManger = blackfynnManager