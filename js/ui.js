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

  this.buildDatGui = function(datguiDefinition){
    if (gui !== undefined){
      return
    }
    gui = new dat.GUI({autoPlace: false, width: 300})
    gui.domElement.id = 'gui'
    gui.close()
    parentDiv.querySelector('.dat-gui-container').appendChild(gui.domElement)
    for (let [key, value] of Object.entries(datguiDefinition)) {
      gui.add(datguiDefinition, key)
    }
    return gui 
  }

  this.setTitle = function(newTitle){
    parentDiv.querySelector('#title').innerHTML = newTitle
  }

  this.hideSelector = function(){
    parentDiv.querySelector('.channel').style.display = 'none'
  }

  this.showSelector = function(){
    parentDiv.querySelector('.channel').style.display = 'block'
  }

  this.hideDatGui = function(){
    parentDiv.querySelector('.dat-gui-container').style.display = 'none'
  }
  this.showDatGui = function(){
    parentDiv.querySelector('.dat-gui-container').style.display = ''
  }

  this.showDirectoryContent = function(){
    parentDiv.querySelectorAll('.multi-file')[0].style.display = 'block'
    parentDiv.querySelectorAll('.multi-file')[1].style.display = 'block'
  }

  this.loadingGif = function(target){
    this.showLoadingGif()
    target().then( _ => {
      this.hideLoadingGif()
    }) 
  }

  this.showLoadingGif = function(){
    parentDiv.querySelector('#loading_gif').style.display = ''
  }

  this.hideLoadingGif = function(){
    parentDiv.querySelector('#loading_gif').style.display = 'none'
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
    select.innerHTML = "<option placeholder>Plot a Data Trace</option>"
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
   
    _this.choice = new Choices(select, {
      placeholder: true,
      searchPlaceholderValue: 'Search Traces'
    })
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
