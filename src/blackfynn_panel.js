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
    var savedData

    var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    var baseURL = "http://0.0.0.1:80";
	
	var _this = this;


	function drawBasic(data2){

      var data = new google.visualization.DataTable();
      data = processData(data2);

      var options = {
        hAxis: {
          title: 'Time'
        },
        animation: {
	    	startup: true,
			duration: 1000,
			easing: 'out'},
        vAxis: {
          title: 'EEG Reading'
        }
      };
      var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
      chart.draw(data, options);

      $()
    }

	function createDatasetDropdown(response) {
	    var select, i, option;   

	    console.log('response in createDatasetDropdown is : ' + response)
	    select = document.getElementById( 'select_dataset' );
	    $("#select_dataset").empty();

	    for (var i in response){
	        option = document.createElement( 'option' );
	        option.value = option.text = response[i]
	        select.add( option );  
	    }


	}

	function createChannelDropdown(response) {
	    var select, i, option;

	    select = document.getElementById( 'select_channel' );
	    $("#select_channel").empty();

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

	function channelNamesCall(dataset){
		var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = baseURL;

    	getChannelNames(cors_api_url + baseRestURL, dataset, function childrenCallBack(response) {
	        this.allSets = response;
	        createChannelDropdown(response.data)
	    });

	    function getChannelNames(baseRestURL, dataset_name, callback){
	        var APIPath = "/api/get_channels";
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
	                window.blackfynn_response3 = JSON.parse(request2.responseText);
	                var response = JSON.parse(request2.responseText);
	                return callback(response)
	        }

	        request2.open(method, url, async);
	        request2.setRequestHeader('Name', dataset_name);
	        request2.send(null);
	    }
	}

	function datasetCall(dataset){
		var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = baseURL;

	    getDataSet(cors_api_url + baseRestURL, $('#select_dataset :selected').text(), function childrenCallBack(response) {
	        this.allSets = response;
	        data = processData(JSON.parse(response.data))
	        savedData = JSON.parse(response.data)
	        drawBasic(JSON.parse(response.data))
	        channelNamesCall($('#select_dataset :selected').text())
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

	function channelCall(){
		var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = baseURL;

	    getChannel(cors_api_url + baseRestURL, $('#select_channel :selected').text(), function childrenCallBack(response) {
	        this.allSets = response;
	        data = processData(JSON.parse(response.data))
	        savedData = JSON.parse(response.data)
	        drawBasic(JSON.parse(response.data))
	    });

	    function getChannel(baseRestURL, channel_name, callback){
	        var APIPath = "/api/get_channel";
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
	                var response = JSON.parse(request2.responseText);
	                return callback(response)
	        }

	        request2.open(method, url, async);
	        request2.setRequestHeader('Name', $('#select_dataset :selected').text());
	        request2.setRequestHeader('Channel', channel_name);
	        request2.send(null);
	    }

	}

	var login = function() {

	var cors_api_url = '';
    var baseRestURL = baseURL;
	createAuthToken(cors_api_url + baseRestURL, function authCallBack(response) {
        this.datasets = response
        createDatasetDropdown(response.names);
        channelNamesCall(response.names[0])
        console.log('this', this)
        


    });
    document.getElementById('select_dataset').onchange = datasetCall
    document.getElementById('select_channel').onchange = channelCall

    }

    function createAuthToken(baseRestURL, callback ) {
        var APIPath = "/api/get_timeseries_dataset_names";
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
	    data2.addColumn({type:'string', role:'annotation'})
	    data2.addColumn('number', 'EEG value');
	    
	    var ind = 0.00
	    for (var i in data) {
	        var row = [ind, null, data[i]]
	        data2.addRow(row)
	        ind = ind + .04;
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

      this.chartData = new google.visualization.DataTable();
      this.chartData = processData(savedData);

      // add a blank row to the end of the DataTable to hold the annotations
      this.chartData.addRow([.5,  'point five', null]);
      this.annotationRowIndex = data.getNumberOfRows();

      this.chartOptions = {
        hAxis: {
          title: 'Time'
        },
        
        vAxis: {
          title: 'ECG Reading'
        },
        annotation: {
            1: {
                // set the style of the domain column annotations to "line"
                style: 'line'
            }
        },
      };
      this.chart = new google.visualization.LineChart(document.getElementById('chart_div'));
      this.chart.draw(this.chartData, this.chartOptions);
      

    }
    this.updateChart = function(time){
    	this.chartData.setValue(this.annotationRowIndex, 0, time/100)
    	this.chartData.setValue(this.annotationRowIndex, 1, '+')
		this.chartData.setValue(this.annotationRowIndex, 2, null)
    	this.chart.draw(this.chartData, this.chartOptions);
    }

    this.updateChartExternal = function(time){
    	window.blackfynnViewer.chartData.setValue(window.blackfynnViewer.annotationRowIndex, 0, time/100)
    	x_scaled = time*750/3000
    	if(Math.ceil(x_scaled) == Math.floor(x_scaled)){
    		interp_y = window.blackfynnViewer.chartData.getValue(x_scaled, 2)
    	}
    	else{
			upper_y = window.blackfynnViewer.chartData.getValue(Math.ceil(x_scaled), 2)
			lower_y = window.blackfynnViewer.chartData.getValue(Math.floor(x_scaled), 2)
			interp_y = upper_y*(1-(Math.ceil(x_scaled)-x_scaled)) + lower_y*(1-(x_scaled-Math.floor(x_scaled)))
		}
    	time_indexed = time
    	window.blackfynnViewer.chartData.setValue(window.blackfynnViewer.annotationRowIndex, 1, interp_y.toFixed(1))
		window.blackfynnViewer.chartData.setValue(window.blackfynnViewer.annotationRowIndex, 2, null)
    	window.blackfynnViewer.chart.draw(window.blackfynnViewer.chartData, window.blackfynnViewer.chartOptions);
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