// login creates logs a user in on the backend with given API keys
var $ = require('jquery')
const dat = require('dat.gui');

function UI (parentDiv) {
  // parentDiv.querySelector('#dataset_div').style.display = 'none'
  // parentDiv.querySelector('#channel_div').style.display = 'none'
  // parentDiv.querySelector('#OpenCORLinkButton').style.display = 'none'
  // parentDiv.querySelector('#instructions_div').style.display = 'none'
  var _this = this
  _this.dataType = 'scatter'
  var gui = undefined
  var folder = undefined

  var settings = {}
  var checkboxes = []
  var checkboxElements = []

  this.buildDatGui = function(){
    if (gui !== undefined){
      gui.destroy()
    }
    gui = new dat.GUI({autoPlace: false})
    gui.domElement.id = 'gui'
    gui.close()
    parentDiv.querySelector('.dat-gui-container').appendChild(gui.domElement)
    folder = gui.addFolder('Channels')
  }
  
  var clearSelect = function (select) { 
    if (select.options !== undefined){
      for (let a in select.options) { select.options.remove(0) }
    }
  }

  this.hideSelector = function(){
    parentDiv.querySelector('#channel_div').style.display = 'none'
  }
  this.showSelector = function(){
    parentDiv.querySelector('#channel_div').style.display = ''
  }

  this.hideDatGui = function(){
    parentDiv.querySelector('.dat-gui-container').style.display = 'none'
  }
  this.showDatGui = function(){
    parentDiv.querySelector('.dat-gui-container').style.display = ''
  }

   //Currently not working
   this.checkAllBoxes = function(){
    for (let i in checkboxElements){
      checkboxElements[i].__checkbox.checked = true
    }
  }

  // CreateChannelDropdown populates a dropdown box for the user to select a channel
  this.createSelectDropdown = function (channelsIn) {
    _this.hideDatGui()
    _this.showSelector()
    var select, option
    select = parentDiv.querySelector('#select_channel')
    select.innerHTML = ''
    var channels = [...channelsIn]

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

  this.createDatGuiDropdown = function (channels, onchangeFunc) {
    _this.buildDatGui()
    _this.hideSelector()
    _this.showDatGui()
    _this.channels = [...channels]
    if (channels[0].toLowerCase().includes('time')){
      channels.shift()
    }
    checkboxes = []
    for (let i in _this.channels) {
      let name = _this.channels[i]
      let checkbox = {}
      checkbox[name] = false
      checkboxes.push(checkbox)
      var el = folder.add(checkboxes[i], name)
      checkboxElements.push(el)
      window.el = el
      // el.__li.onclick = () => onchangeFunc(name)
      el.__checkbox.onclick = () => onchangeFunc(name, i, checkboxes[i][name])
    }
    window.checkboxes = checkboxes
    folder.open()
   
  }  
}

module.exports = UI
