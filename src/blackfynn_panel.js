

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
	var session_token = '';
    var organisation = '';
    var loaded_session_token = 0;
    this.datasets = [];
    var times, x, plot, chart, data, chartOptions, chartData, inc, options, allData,savedData;
    var colours= [];

    var cors_api_url = '';//'https://cors-anywhere.herokuapp.com/';
    var baseURL = "https://blackfynnpythonlink.ml";
	
	var _this = this;


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
		//'https://cors-anywhere.herokuapp.com/';
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
		//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = baseURL;

	    getDataSet(cors_api_url + baseRestURL, $('#select_dataset :selected').text(), function childrenCallBack(response) {
	    	resetData();
	        this.allSets = response;
	        data = processData(JSON.parse(response.data))
	        savedData = JSON.parse(response.data)
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
		//'https://cors-anywhere.herokuapp.com/';
    	var baseRestURL = baseURL;

	    getChannel(cors_api_url + baseRestURL, $('#select_channel :selected').text(), function childrenCallBack(response) {
	        this.allSets = response;
	        data = JSON.parse(response.data);
	        if (plot !== undefined) {
	    		addDataSeriesToChart(data, $('#select_channel :selected').text());
	    	}
	    	else {
	        	savedData = data;
	        	createChart(data, $('#select_channel :selected').text());
	        	// document.getElementById('chartLoadingGif').remove();
	    	}
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

	
    var baseRestURL = baseURL;
	createAuthToken(cors_api_url + baseRestURL, function authCallBack(response) {
        this.datasets = response
        createDatasetDropdown(response.names);
        channelNamesCall(response.names[0])
        showUI();
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

	 
    function resetData(){
    	if ( plot !== undefined ) {
    		Plotly.purge('chart_div') 		
    	}	
    }
	

	
	

	function createChart(createChartData, id){
		if (plot !== undefined){
			Plotly.purge('chart_div')
		}

	  	times = [];
		for(var i in createChartData ) {
    	  times.push(i);
		}	

      chartData = processData(createChartData, id);

      chartOptions = {
  		title: 'ECG signals', 
  		xaxis: {
  		  type: 'seconds',
  		  title: 'Seconds'
  		}, 
  		yaxis: {
  		  autorange: true, 
  		  type: 'linear',
  		  title: 'mV'
  		}
  	  };
  	  plot = Plotly.newPlot('chart_div', chartData, chartOptions);
    }

    function processData(unprocessedData, id){

	    var dataTrace = {
	    	type: "scatter",
 			name: 'Electrode ' + id,
 			mode: "lines",
 			x: times,
 			y: unprocessedData,
 			line: {color: '#'+(Math.random()*0xFFFFFF<<0).toString(16)}
	    }	    
	    return [dataTrace]
	}

	function createColours() {
		for (var i = 0; i < 100; i++){
			colours.push('#'+(Math.random()*0xFFFFFF<<0).toString(16))
		}
	}

    function addDataSeriesToChart(newSeries, id){
		//createColours();
		var newData = processData(newSeries, id)
		Plotly.addTraces('chart_div', newData)

	}

	var initialiseBlackfynnPanel = function() {
		
		createOpenCORlink();
		document.getElementById('login').onclick = login


	}

	function createOpenCORlink(){
		
		runModelButton = document.getElementById('OpenCORLinkButton');
		runModelButton.onclick = runModel;

	}


	var runModel = function() {
		
		

		getOpenCORURL(baseURL, function getCallBack(response){
			var opencorURL = 'opencor://openFile/' + response.url;
			window.open(opencorURL, '_self');
			document.getElementById('exportURL').innerHTML = 'File is being stored at: ' + response.url;
		});

		function getOpenCORURL(baseRestURL, callback){
	        var APIPath = "/api/create_openCOR_URL";
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
	        request2.setRequestHeader('notused','notused')
	        request2.send(null);
	    }
	}

	var showUI = function(){
		document.getElementById('dataset_div').style.visiblity = 'visible';
		document.getElementById('channel_div').style.visiblity = 'visible';
		document.getElementById('OpenCORLinkButton').style.visiblity = 'visible';
		document.getElementById('instructions_div').style.visiblity = 'visible';
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
