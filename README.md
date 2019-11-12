Tehsurfer/plotsvy
[![Netlify Status](https://api.netlify.com/api/v1/badges/a81b760a-7b4e-461a-9362-aab4104e2e97/deploy-status)](https://app.netlify.com/sites/plotsvy-demo/deploys)
======
A CSV file web viewer focused on viewing ephys and RNA seq data.

View the latest online demo at:
https://plotsvy-demo.netlify.com
_(This demo is deployed from tehsurfer/plotsvy:netlify-hosting)_

Devloper Installation
------
1. `git clone https://github.com/ABI-Software/plotsvy.git`
2. Install [Node.js](https://nodejs.org/en/) if you do not have it (check using `npm -v`)
3. Navigate to the `plotsvy/` directory and: 
```
npm install
npm run pub
```
4. `npm run start` and follow the link to `http://127.0.0.1:8080`
    
Initialising the app and using external API's
-------
```javascript
// Initialises app
var myChart = new plotsvy(targetDiv)

// Initialises app and load csv file.
var myChart = new plotsvy(targetDiv, 'path/to/any/csv/file.csv')

// Recieve alerts on state of app
myChart.openBroadcastChannel('plot-channel');
bc = new BroadcastChannel.default('plot-channel');
bc.addEventListener('message', onMessage);
```


