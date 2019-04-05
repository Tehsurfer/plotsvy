// login creates logs a user in on the backend with given API keys
var $ = require('jquery')

class UI {

  hideLogin () {
    $('.container-login100').hide('slow')
    $('.datasetUI').show('slow')
  }

  // CreateChannelDropdown populates a dropdown box for the user to select a channel
  createChannelDropdown (channels) {
    var select, option
    select = document.getElementById('select_channel')
    $('#select_channel').empty()

    for (var i in channels) {
      option = document.createElement('option')
      option.value = option.text = channels[i]
      select.add(option)
    }
  }

  // CreateDatasetDropdown populates a dropdown box for the user to select a dataset
  createDatasetDropdown (datasets) {
    var select, option
    select = document.getElementById('select_dataset')
    $('#select_dataset').empty()

    for (var i in datasets) {
      option = document.createElement('option')
      option.value = option.text = datasets[i]
      select.add(option)
    }
  }

  showApp () {
    document.getElementById('dataset_div').style.visiblity = 'visible'
    document.getElementById('channel_div').style.visiblity = 'visible'
    document.getElementById('OpenCORLinkButton').style.visiblity = 'visible'
    document.getElementById('instructions_div').style.visiblity = 'visible'
  }

  loginMethodSwitch () {
    if (document.getElementById('login_switch').innerHTML === 'Email/Password') {
      document.getElementById('api_key').placeholder = 'Email'
      document.getElementById('api_key').value = ''
      document.getElementById('secret').placeholder = 'Password'
      document.getElementById('secret').value = ''
      document.getElementById('login_switch').innerHTML = 'API Keys'
    } else {
      document.getElementById('api_key').placeholder = 'API Key'
      document.getElementById('api_key').value = ''
      document.getElementById('secret').placeholder = 'API Secret'
      document.getElementById('secret').value = ''
      document.getElementById('login_switch').innerHTML = 'Email/Password'
    }
  }
}

module.exports = UI
