/**
* BlackfynnPanel is used for making calls to blackfynn to collect timeseries data and plot it using plotly
*/

//dat.gui container for cellGui
var cellGui = undefined;
var otherCellControls = undefined;
var dialogObject = undefined;
var localDialogName = 'Blackfynn Panel';
var session_token = '';
var organisation = '';

var times, x, plot, chart, data, chartOptions, chartData, inc, options, allData, savedData;
var colours = [];

var cors_api_url = ''; //'https://cors-anywhere.herokuapp.com/';
var baseURL = "https://blackfynnpythonlink.ml";

var _this = this;
this.datasets = [];

// login creates logs a user in on the backend with given API keys
function login() {
    showUI();
    var baseRestURL = baseURL;
    $('.container-login100').hide('slow')
    $('.datasetUI').show('slow')
    createAuthToken(cors_api_url + baseRestURL, function authCallBack(response) {

        this.datasets = response
        createDatasetDropdown(response.names);
        channelNamesCall(response.names[0]);
    });
    document.getElementById('select_dataset').onchange = datasetCall
    document.getElementById('select_channel').onchange = channelCall
    channelCall();
    }

function createAuthToken(baseRestURL, callback) {
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

// datasetCall retrieves the names of abailable datasets/
function datasetCall(dataset) {

	var headerNames = ['name', 'Channel'];
	var headerValues = [$('#select_dataset :selected').text(), 'dataset_name'];
	var APIPath = "/api/get_channel_data";

    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        resetData();
        data = processData(JSON.parse(response.data))
        savedData = JSON.parse(response.data)
        channelNamesCall($('#select_dataset :selected').text())
    });
}


// channelNames call sends channel names to createDatasetDropdown to create the dropdown selection
function channelNamesCall(dataset) {
	var headerNames = ['Name'];
	var headerValues = [dataset];
	var APIPath = "/api/get_channels";
    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        createChannelDropdown(response.data)
    });
}

 // CreateDatasetDropdown populates a dropdown box for the user to select a dataset
function createDatasetDropdown(response) {
    var select, option;
    select = document.getElementById('select_dataset');
    $("#select_dataset").empty();

    for (var i in response) {
        option = document.createElement('option');
        option.value = option.text = response[i]
        select.add(option);
    }
}

// CreateChannelDropdown populates a dropdown box for the user to select a channel
function createChannelDropdown(response) {
    var select, option;
    select = document.getElementById('select_channel');
    $("#select_channel").empty();

    for (var i in response) {
        option = document.createElement('option');
        option.value = option.text = response[i]
        select.add(option);
    }
}

function channelCall() {
	var headerNames = ['Name', 'Channel'];
	var headerValues = [$('#select_dataset :selected').text(), $('#select_channel :selected').text()];
	var APIPath = "/api/get_channel";

    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        data = JSON.parse(response.data);
        if (plot !== undefined) {
            addDataSeriesToChart(data, $('#select_channel :selected').text());
        } else {
            savedData = data;
            createChart(data, $('#select_channel :selected').text());
            // document.getElementById('chartLoadingGif').remove();
        }
    });
}


function resetData() {
    if (plot !== undefined) {
        Plotly.purge('chart_div')
        plot = undefined;
    }
}

function createChart(createChartData, id) {

    if (plot !== undefined) {
        Plotly.purge('chart_div')
    }

    times = [];
    for (var i in createChartData) {
        times.push(i);
    }

    chartData = processData(createChartData, id);

    chartOptions = {
        title: 'Selected Channels Plot ',
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

function addDataSeriesToChart(newSeries, id) {
    var newData = processData(newSeries, id)
    Plotly.addTraces('chart_div', newData)

}

function processData(unprocessedData, id) {

    var dataTrace = {
        type: "scatter",
        name: id,
        mode: "lines",
        x: times,
        y: unprocessedData,
        line: {
            color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
        }
    }
    return [dataTrace]
}


var initialiseBlackfynnPanel = function() {
    $('.datasetUI').hide('fast')
    createOpenCORlink();
    document.getElementById('login').onclick = login


}

function createOpenCORlink() {
    runModelButton = document.getElementById('OpenCORLinkButton');
    runModelButton.onclick = runModel;
}


function runModel() {
	var headerNames = ['unused'];
	var headerValues = ['unused'];
	var APIPath = "/api/create_openCOR_URL";
    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        // var opencorURL = 'opencor://openFile/' + response.url;
        window.open(response.url, '_self');
        document.getElementById('exportURL').innerHTML = 'File is being stored at: ' + response.url;
    });
}

var showUI = function() {
    document.getElementById('dataset_div').style.visiblity = 'visible';
    document.getElementById('channel_div').style.visiblity = 'visible';
    document.getElementById('OpenCORLinkButton').style.visiblity = 'visible';
    document.getElementById('instructions_div').style.visiblity = 'visible';
}


function getRequest(baseRestURL, APIPath, headerNames, headerValues, callback){
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
    for ( var i in headerNames){
    	request2.setRequestHeader(headerNames[i], headerValues[i]);
    }
    request2.send(null);
}

initialiseBlackfynnPanel();

