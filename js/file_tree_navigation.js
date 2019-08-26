// index.js - Loads file structure and links the html elements to corresponding s3 urls

const TreeView = require('./js_treeview_mod')

function FileTreeNavigation(targetDiv, metaUrl, callback){ 
    var s3path = 'https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/stellate/'
    var treeData = undefined

    fetch(metaUrl).then(response => {
        response.json().then(json => {
            treeData = json['data']
            s3path = json['data']['path']
        
        createNavigation()
        })
    })

    function createNavigation() {
        var tree = new TreeView([treeData], targetDiv) // Create our directory tree navigation
        tree.on('select', (ev) => {
            url = s3path + ev.data.path
            callback(url)
        })
    }

}
module.exports = FileTreeNavigation
