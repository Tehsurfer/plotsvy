// login creates logs a user in on the backend with given API keys
var $ = require('jquery')

function UI () {
  var parentDiv = document.getElementById('blackfynn-panel')
  // parentDiv.querySelector('#dataset_div').style.display = 'none'
  // parentDiv.querySelector('#channel_div').style.display = 'none'
  // parentDiv.querySelector('#OpenCORLinkButton').style.display = 'none'
  // parentDiv.querySelector('#instructions_div').style.display = 'none'
  $('#blackfynn-panel .datasetUI').hide('fast')
  
  this.hideLogin = function () {
    $('#blackfynn-panel .container-login100').hide('slow')
    $('#blackfynn-panel .datasetUI').show('slow')
  }

  this.showLogin = function () {
    $('#blackfynn-panel .datasetUI').hide('slow')
    $('#blackfynn-panel .container-login100').show('slow')
    clearSelect(parentDiv.querySelector('#dataset_div'))
    clearSelect(parentDiv.querySelector('#channel_div'))
  }

  var clearSelect = function (select) { 
    for (let a in select.options) { select.options.remove(0) }
  }

  // CreateChannelDropdown populates a dropdown box for the user to select a channel
  this.createChannelDropdown = function (channels) {
    var select, option
    select = parentDiv.querySelector('#select_channel')
    select.innerHTML = ''

    for (var i in channels) {
      option = document.createElement('option')
      option.value = option.text = channels[i]
      select.add(option)
    }
  }

  // CreateDatasetDropdown populates a dropdown box for the user to select a dataset
  this.createDatasetDropdown = function (datasets) {
    var select, option
    select = parentDiv.querySelector('#select_dataset')
    select.innerHTML = ''

    for (var i in datasets) {
      option = document.createElement('option')
      option.value = option.text = datasets[i]
      select.add(option)
    }
  }

  this.showApp = function () {
    parentDiv.querySelector('#dataset_div').style.display = 'revert'
    parentDiv.querySelector('#channel_div').style.display = 'revert'
    parentDiv.querySelector('#OpenCORLinkButton').style.display = 'revert'
    parentDiv.querySelector('#instructions_div').style.display = 'revert'
  }

  this.loginMethodSwitch = function () {
    if (parentDiv.querySelector('#login_switch').innerHTML === 'Email/Password') {
      parentDiv.querySelector('#api_key').placeholder = 'Email'
      parentDiv.querySelector('#api_key').value = ''
      parentDiv.querySelector('#secret').placeholder = 'Password'
      parentDiv.querySelector('#secret').value = ''
      parentDiv.querySelector('#login_switch').innerHTML = 'API Keys'
    } else {
      parentDiv.querySelector('#api_key').placeholder = 'API Key'
      parentDiv.querySelector('#api_key').value = ''
      parentDiv.querySelector('#secret').placeholder = 'API Secret'
      parentDiv.querySelector('#secret').value = ''
      parentDiv.querySelector('#login_switch').innerHTML = 'Email/Password'
    }
  }
}

module.exports = UI
