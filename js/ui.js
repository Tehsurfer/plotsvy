// login creates logs a user in on the backend with given API keys
const dat = require('dat.gui');
const Choices = require('choices.js')
require('choices.js/public/assets/styles/choices.css')
require('.././css/main.css')
require('.././css/util.css')

function UI (parentDiv) {
  var _this = this
  var gui = undefined
  var folder = undefined
  var checkboxes = []
  _this.dataType = 'scatter'
  _this.checkboxElements = []
  _this.choice = undefined

  this.buildDatGui = function(exportObj){
    if (gui !== undefined){
      return
    }
    gui = new dat.GUI({autoPlace: false, width: 300})
    gui.domElement.id = 'gui'
    gui.close()
    parentDiv.querySelector('.dat-gui-container').appendChild(gui.domElement)
    gui.add(exportObj, 'Show All')
    gui.add(exportObj, 'Hide All')
    gui.add(exportObj, 'Switch Axes')
    gui.add(exportObj, 'Export as CSV')
    gui.add(exportObj, 'Open in OpenCOR')
    return gui 
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
    for (let i in _this.checkboxElements){
      _this.checkboxElements[i].__checkbox.checked = true
    }
  }

  // CreateChannelDropdown populates a dropdown box for the user to select a channel
  this.createSelectDropdown = function (channelsIn) {
    // _this.hideDatGui()
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

    if (_this.choice !== undefined){
      _this.choice.destroy()
    }
    for (let i in channels) {
      option = document.createElement('option')
      option.value = option.text = channels[i]
      select.add(option)
    }
    _this.choice = new Choices(select)
  }

  this.createDatGuiDropdown = function (channels, onchangeFunc) {
    _this.hideSelector()
    _this.showDatGui()
    _this.channels = [...channels]
    gui.removeFolder('Channels')
    folder = gui.addFolder('Channels')
    if (channels[0].toLowerCase().includes('time')){
      channels.shift()
    }
    _this.checkboxElements = []
    checkboxes = []
    for (let i in _this.channels) {
      let name = _this.channels[i]
      let checkbox = {}
      checkbox[name] = false
      checkboxes.push(checkbox)
      var el = folder.add(checkboxes[i], name)
      _this.checkboxElements.push(el)
      el.__checkbox.onclick = () => onchangeFunc(name, Number(i)+1, checkboxes[i][name])
    }
    folder.open()
  }  
}

dat.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
}

module.exports = UI
