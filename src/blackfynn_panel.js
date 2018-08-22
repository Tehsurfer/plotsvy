var dat = require("./dat.gui.js");
require("./styles/dat-gui-swec.css");
google.charts.load('current', {packages: ['corechart', 'line']});


/**
 * Used for logging into blackfynn

 	note that this file is currently modified to use a login as opposed to an API key
 */
exports.BlackfynnPanel = function(dailogName)  {

	//dat.gui container for cellGui
	var cellGui = undefined;
	var otherCellControls = undefined;
	var dialogObject = undefined;
	var localDialogName = dailogName;
	var session_token = ''
    var organisation = ''
    var loaded_session_token = 0
    this.datasets = []

    var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    var baseURL = "http://127.0.0.1:5000/";
	
	var _this = this;


	function drawBasic(){

      var data = new google.visualization.DataTable();
      data = processData(data);

      var options = {
        hAxis: {
          title: 'Time'
        },
        vAxis: {
          title: 'EEG Reading'
        }
      };
      var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
      chart.draw(data, options);
    }

	function createDatasetDropdown(response) {
	    var select, i, option;   

	    console.log('response in createDatasetDropdown is : ' + response)
	    select = document.getElementById( 'select_dataset' );

	    for (var i in response){
	        option = document.createElement( 'option' );
	        option.value = option.text = response[i]
	        select.add( option );  
	    }


	}

	function findTimeseriesData(){
	    for (var i in this.allSets.children){
	        if (this.allSets.children[i].subtype == 'Timeseries'){
	            this.timeseries_id = this.allSets.children[i].content.id;
	        }
	    }

	}

	function datasetCall(dataset){
		var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = "http://127.0.0.1:5000";

	    getDataSet(cors_api_url + baseRestURL, $('#select_dataset :selected').text(), function childrenCallBack(response) {
	        this.allSets = response;
	        data = processData(JSON.parse(response.data))
	        drawBasic(data)
	    });




	    function getDataSet(baseRestURL, dataset_name, callback){
	        var APIPath = "/api/get_channel_data";
	        var completeRestURL = baseRestURL + APIPath;
	        console.log("REST API URL: " + completeRestURL);

	        var method = "GET";
	        var url = completeRestURL;
	        var async = true;
	        var request2 = new XMLHttpRequest();
	        request2.onload = function() {
	                console.log("ONLOAD");
	                var status = request2.status; // HTTP response status, e.g., 200 for "200 OK"
	                console.log(status);
	                window.blackfynn_response2 = JSON.parse(request2.responseText);
	                var response = JSON.parse(request2.responseText);
	                return callback(response)
	        }

	        request2.open(method, url, async);
	        request2.setRequestHeader('name', dataset_name);
	        request2.setRequestHeader('Channel', 'dataset_name');
	        request2.send(null);
	    }
	}

	var login = function() {

	var cors_api_url = '';
    var baseRestURL = "http://127.0.0.1:5000";
	createAuthToken(cors_api_url + baseRestURL, function authCallBack(response) {
        this.datasets = response
        createDatasetDropdown(response.names);
        console.log('this', this)
        


    });
    document.getElementById('select_dataset').onchange = datasetCall

    }

    function createAuthToken(baseRestURL, callback ) {
        var APIPath = "/api/get_timeseries_names";
        var completeRestURL = baseRestURL + APIPath;
        console.log("REST API URL: " + completeRestURL);

        var method = "POST";
        var postData = "{\"tokenId\": \"" + document.getElementById('api_key').value + "\",\"secret\": \"" + document.getElementById('secret').value + "\",\"loginMode\": 1,\"applicationType\": 35}";
        var url = completeRestURL;
        var async = true;
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState == 4 && (request.status == 200 || request.status == 201)) {
                console.log("ONLOAD");
                var status = request.status; // HTTP response status, e.g., 200 for "200 OK"
                console.log(status);
                window.blackfynn_response = JSON.parse(request.responseText);
                var response = JSON.parse(request.responseText);
                console.log(response);
                
                

                return callback(response);

            }

        }

        request.open(method, url, async);
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Accept", "application/json");
        request.send(postData);

    }


	function processData(data){

	    var data2 = new google.visualization.DataTable();
	    data2.addColumn('number', 'Time');
	    data2.addColumn('number', 'EEG value');
	    var ind = 0.02
	    for (var i in data) {
	        var row = [ind, data[i]]
	        data2.addRow(row)
	        ind = ind + .02;
	    }

	    return data2
	}	 

	

	
	var initialiseBlackfynnPanel = function() {
		cellGui = new dat.GUI({autoPlace: false});
		cellGui.domElement.id = 'blackfynnLogin';
		cellGui.close();

		document.getElementById('login').onclick = login


	}


	this.drawBasic = function(){

      var data = new google.visualization.DataTable();
      data = processData(data);

      var options = {
        hAxis: {
          title: 'Time'
        },
        vAxis: {
          title: 'ECG Reading'
        }
      };
      var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
      chart.draw(data, options);
    }


	var createNewDialog = function(data) {
    dialogObject = require("./utility").createDialogContainer(localDialogName, data);
    initialiseBlackfynnPanel();
    UIIsReady = true;
    delete link;
    }
	

	
	 var initialise = function() {
	   createNewDialog(require("./snippets/blackfynnPanel.html"));
  }
	
	initialise();
	
}