Tehsurfer/plotsvy
[![Netlify Status](https://api.netlify.com/api/v1/badges/a81b760a-7b4e-461a-9362-aab4104e2e97/deploy-status)](https://app.netlify.com/sites/plotsvy-demo/deploys)
======
A CSV file web viewer

View the current online version at:
https://plotsvy-demo.netlify.com

Devloper Installation
------
1. `git clone https://github.com/Tehsurfer/blackfynn-csv-exporter.git`
2. Install [Node.js](https://nodejs.org/en/) if you do not have it (check using `npm -v`)
3. Navigate to the /blackfynn-csv-export directory and: 
```
npm install
npm run pub
```
4. Open index.html in Firefox 

    OR
    
    Use `python -m http.server`
    
    Go to http://0.0.0.0:8000/index.html with Chrome
    
Using the app and External API's
-------
```javascript
// Initialises app.
var blackfynnManger = new BlackfynnManager()
blackfynnManger.initialiseBlackfynnPanel()


//Initialises app on document load.
var blackfynnManger = new BlackfynnManager()
document.addEventListener("DOMContentLoaded", function(event) { 
  blackfynnManger.initialiseBlackfynnPanel()
});

// Send data to app before or after login
var blackfynnManger = new BlackfynnManager()
blackfynnManager.insert('N:package:51ae7443-0e8e-40ac-84bc-a1fcceb9d867','EEG FZ-REF')
blackfynnManger.initialiseBlackfynnPanel()
blacfynnManager.login()
blackfynnManager.insert('Sample Time Series (EEG)','EEG C3-REF')

// serialise to JSON and load from JSON
var blackfynnManager = new blackfynn_panel.BlackfynnManager()
serialisedPanel = blackfynnManager.exportState()
console.log(serialisedPanel)
// "{"parentDiv":{},"selectedChannels":[],"csvURL":""}"
blackfynnManager.loadState(serialisedPanel)

// Load csv files and plot as single plot or subplot
bf = new blackfynn_panel.BlackfynnManager()
bf.openCSV('https://cors-anywhere.herokuapp.com/https://abi-test.ml/Cors_Test/Sample_1_18907001_channel_1.csv')
bf.plotAll() // Plot all csv channels and remover selector
bf.openBroadcastChannel('my_name') // set broadcast channel name which returns serialised state on select.onchange
```


