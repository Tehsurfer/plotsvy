var $ = require('jquery')
var Papa = require('papaparse')

function CsvManager() {

    self = this
    self.csv_data = undefined

    this.loadFile = function(file_url, callback) {

        const cors = 'https://cors-anywhere.herokuapp.com/'

        $.get(cors+file_url).then( (response) => {
            self.csv_data = Papa.parse(response)
            callback()
          });
        
    }

    this.getHeaders = function(){
        return self.csv_data.data[0]
    }

    this.getSampleRate = function(){
        return 1/(self.csv_data.data[1][1] - self.csv_data.data[1][0])
    }

    this.getColoumnByIndex = function(index){
        return self.csv_data.data.map( (row) => { return row[index]})
    }

    this.getColoumnByName = function(column_name){
        var column_index = 0
        for (i in self.csv_data.data[0]){
            if (self.csv_data.data[0][i] === column_name){
                column_index = i
            }
        }
        return this.getColoumnByIndex(column_index)       
    }


}





module.exports = CsvManager