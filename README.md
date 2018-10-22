Tehsurfer/MPB
======
A Web viewer for viewing ECG data stored in Blackfynn on a 3D model of the heart exported from Zinc

View the current online version at:
http://blackfynnpythonlink.ml/display/MPB/simple_heart/

Devloper Installation
------
1. `git clone https://github.com/Tehsurfer/MPB.git`
2. Install [Node.js](https://nodejs.org/en/) if you do not have it (check using `npm -v`)
3. Navigate to the /MPB directory and: 
```
npm install webpack@4.19.0
npm install jquery
npm run build
```
4. Open simple_heart/index.html in Firex 

    OR
    
    Use `python -m http.server`
    
    Go to http://0.0.0.0:8000/simple_heart/index.html with Chrome
