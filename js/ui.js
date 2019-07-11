// login creates logs a user in on the backend with given API keys
var $ = require('jquery')

function UI (parentDiv) {
  // parentDiv.querySelector('#dataset_div').style.display = 'none'
  // parentDiv.querySelector('#channel_div').style.display = 'none'
  // parentDiv.querySelector('#OpenCORLinkButton').style.display = 'none'
  // parentDiv.querySelector('#instructions_div').style.display = 'none'
  _this = this
  _this.dataType = 'scatter'

  
  var clearSelect = function (select) { 
    for (let a in select.options) { select.options.remove(0) }
  }

  this.hideSelector = function(){
    parentDiv.querySelector('#channel_div').style.display = 'none'
  }
  this.showSelector = function(){
    parentDiv.querySelector('#channel_div').style.display = 'revert'
  }

  // CreateChannelDropdown populates a dropdown box for the user to select a channel
  this.createChannelDropdown = function (channels) {
    var select, option
    select = parentDiv.querySelector('#select_channel')
    select.innerHTML = ''

    if (channels[0].toLowerCase().includes('time')){
      channels[0] = '-- Select A Channel --'
    }

    if (channels[0].toLowerCase().includes('name')){
      channels[0] = '-- Select A Sample --'
    }

    for (let i in channels) {
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

    for (let i in datasets) {
      option = document.createElement('option')
      option.value = option.text = datasets[i]
      select.add(option)
    }
  }

  var showApp = function () {
    parentDiv.querySelector('#dataset_div').style.display = 'revert'
    parentDiv.querySelector('#channel_div').style.display = 'revert'
    parentDiv.querySelector('#OpenCORLinkButton').style.display = 'revert'
    parentDiv.querySelector('#instructions_div').style.display = 'revert'
  }

}

module.exports = UI
