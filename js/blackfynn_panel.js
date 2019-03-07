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
function apiKeyLogin(apiKey, apiSecret) {
   
    createAuthToken(cors_api_url + baseURL, apiKey, apiSecret, function authCallBack(response) {

        this.datasets = response
        createDatasetDropdown(response.names);
        channelNamesCall(response.names[0]);
    });
    document.getElementById('select_dataset').onchange = datasetCall
    document.getElementById('select_channel').onchange = channelCall
    $('.container-login100').hide('slow')
    $('.datasetUI').show('slow')
    channelCall();
}

function createAuthToken(baseRestURL, apiKey, apiSecret, callback) {
    var APIPath = "/api/get_timeseries_dataset_names";
    var completeRestURL = baseRestURL + APIPath;
    console.log("REST API URL: " + completeRestURL);

    var method = "POST";
    var postData = "{\"tokenId\": \"" + apiKey + "\",\"secret\": \"" + apiSecret + "\",\"loginMode\": 1,\"applicationType\": 35}";
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
    document.getElementById('chart_div').style.height = '700px'

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
    document.getElementById('login_switch').onclick = login_switch
    document.getElementById('logout_button').onclick = logout

    checkForSessionToken()

}

function logout(){
    localStorage.clear();
    $('.datasetUI').hide('slow')
    $('.container-login100').show('slow')
    if (plot !== undefined) {
        Plotly.purge('chart_div')
    }
    document.body.scrollTop = document.documentElement.scrollTop = 0;

}

function checkForSessionToken(){

  const token = localStorage.getItem('auth_token');
  if (token) {
    checkSession(token, response => {
        if ( response.status === 'success' ) {
            apiKeyLogin(response.data.api_token, response.data.api_secret)
        }
    });
  }
}


function createOpenCORlink() {
    runModelButton = document.getElementById('OpenCORLinkButton');
    runModelButton.onclick = runModel;

    exportCSVButton = document.getElementById('csvExportButton');
    exportCSVButton.onclick = exportCSV;
}


function runModel() {
	var headerNames = ['unused'];
	var headerValues = ['unused'];
	var APIPath = "/api/create_openCOR_URL";
    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        var urlPrefix = 'opencor://importFile/';
        window.open(urlPrefix + response.url, '_self');
        document.getElementById('exportURL').innerHTML = 'File is being stored at: ' + response.url;
    });
}

function exportCSV() {
    var headerNames = ['unused'];
    var headerValues = ['unused'];
    var APIPath = "/api/create_openCOR_URL";
    getRequest(cors_api_url + baseURL, APIPath, headerNames, headerValues, function childrenCallBack(response) {
        var urlPrefix = '';
        window.open(urlPrefix + response.url, '_self');
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

function login_switch(){
    if (document.getElementById('login_switch').innerHTML === "Email/Password"){
        document.getElementById('api_key').placeholder = 'Email';
        document.getElementById('secret').placeholder = 'Password';
        document.getElementById('login_switch').innerHTML = 'API Keys';
    }
    else{
        document.getElementById('api_key').placeholder = 'API Key';
        document.getElementById('secret').placeholder = 'API Secret';
        document.getElementById('login_switch').innerHTML = 'Email/Password';
    }
}

function login(){
    showUI();
    var baseRestURL = baseURL;
    if (document.getElementById('login_switch').innerHTML === "Email/Password"){

            createSessionFromKeys( baseURL, response => {
                localStorage.setItem('auth_token', response.auth_token)
                
            });
            apiKeyLogin(document.getElementById('api_key').value, document.getElementById('secret').value)
    }else{
        emailLogin()
    }


}


function emailLogin(){

    
    email_login_post_request(cors_api_url + baseURL, response => {
        localStorage.setItem('auth_token', response.auth_token)
        apiKeyLogin(response.api_token, response.api_secret)
    });
    
}

function email_login_post_request(baseRestURL, callback){
    var APIPath = "/api2/auth/register";
    var completeRestURL = baseRestURL + APIPath;
    console.log("REST API URL: " + completeRestURL);
    var method = "POST";
    var postData = "{\"email\": \"" + document.getElementById('api_key').value + "\",\"password\": \"" + document.getElementById('secret').value + "\",\"loginMode\": 1,\"applicationType\": 35}";
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

function createSessionFromKeys(baseRestURL, callback){
    var APIPath = "/api2/auth/keys";
    var completeRestURL = baseRestURL + APIPath;
    console.log("REST API URL: " + completeRestURL);
    var method = "POST";
    var postData = "{\"api_token\": \"" + document.getElementById('api_key').value + "\",\"api_secret\": \"" + document.getElementById('secret').value + "\",\"loginMode\": 1,\"applicationType\": 35}";
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


function checkSession(session_token, callback){
    var APIPath = "/api2/auth/check";
    var completeRestURL = baseURL + APIPath;
    console.log("REST API URL: " + completeRestURL);
    const authorization = 'Bearer ' + session_token
    var method = "POST";
    var postData = "{\"Authorization\": \"" + authorization + "\",\"loginMode\": 1,\"applicationType\": 35}";
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

initialiseBlackfynnPanel();

