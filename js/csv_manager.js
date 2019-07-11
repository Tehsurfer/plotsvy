var $ = require('jquery')
var Papa = require('papaparse')

function CsvManager() {

  _this = this
  _this.csv_data = undefined

  this.loadFile = function (file_url, callback) {
    $.get(file_url).then((response) => {
      _this.csv_data = Papa.parse(response)
      callback()
    });
  }

  this.getDataType = function () {
    first = _this.getHeaders()[0]
    if (first.toLowerCase().includes('time')) {
      return 'scatter'
    } else if (first.toLowerCase().includes('name')) {
      return 'bar'
    }    
    first_col = _this.getColoumnByIndex(0)
    if (Number(first_col[4]) > Number(first_col[3])){
      return 'scatter'
    } else {
      return 'bar'
    }
  }

  this.getHeaders = function () {
    return _this.csv_data.data[0]
  }

  this.getAllData = function () {
    return _this.csv_data.data
  }

  this.getSampleRate = function () {
    return 1 / (_this.csv_data.data[1][1] - _this.csv_data.data[1][0])
  }

  this.getColoumnByIndex = function (index) {
    return _this.csv_data.data.map((row) => { return row[index] })
  }

  this.getHeaderByIndex = function (index) {
    return _this.csv_data.data[0][index]
  }

  this.getColoumnByName = function (column_name) {
    var column_index = 0
    for (i in _this.csv_data.data[0]) {
      if (_this.csv_data.data[0][i] === column_name) {
        column_index = i
      }
    }
    return this.getColoumnByIndex(column_index)
  }

}





module.exports = CsvManager