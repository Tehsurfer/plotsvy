var Plotsvy = require("../../js/plotsvy");
var CSV_Manager = require("../../js/csv_manager")
const PlotManager = require('../../js/plot_manager')
var assert = require('chai').assert;
const nock = require('nock');
const fs = require('fs')
const container = window.document.querySelector("#container");

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    })
  })
})


describe('Plotsvy', function () {
  before('Setup Mock response', function() {
    var scope = nock('https://www.mytestserver.com')
      .persist()
      .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
      .get(function(uri) {
        return uri;
      })
      .reply(200, (uri, requestBody, cb) => {console.log(uri);fs.readFile("." + uri, cb)});
  });
  beforeEach('Reset done', function() {
    currentDone = undefined;
  });

  var plotsvy = new Plotsvy(container)
  describe('#require()', function () {
    it('Should return an object when we require it.', function () {
      assert.isObject(plotsvy)
    })
  })
  describe('#openCSV()', function () {
    it('Should update the state to the given url', function (done) {
      plotsvy.openCSV('https://www.mytestserver.com/data/18907011_channel_1.csv').then(_ => {
        var state = plotsvy.exportState()
        assert.equal(state.csvURL, 'https://www.mytestserver.com/data/18907011_channel_1.csv')
        done()
      })
    })
  })
  describe('#plotByName()', function(){
    it('should update state.selectedChannels to reflect the state', function(done){
        var state = plotsvy.exportState()
        assert.equal(state.selectedChannels, 'Sweep 0_Membrane Potential (mV)' )
        done()
    })
    it('should create channels array when we have two channels', function(done){
      plotsvy.plotByName('Sweep 1_Membrane Potential (mV)')
        var state = plotsvy.exportState()
        assert.isTrue(state.selectedChannels.length === 2)
        done()

    })
  })
  describe('#clearChart()', function(){
    it('should reset selectedChannels to empty array', function(){
      plotsvy.clearChart()
      var state = plotsvy.exportState()
      assert.isTrue(state.selectedChannels.length === 0)
    })
  })
  describe('#createFileNavigation()', function(){
    it('should resolve promise after creating fileNavigator', function(done){
      plotsvy.createFileNavigation('https://www.mytestserver.com/data/example-directory-meta.json').then( _ =>{

        assert.isTrue(true)
        done()
      })
    })
  })
})

describe('CSV_Manager', function () {
  var csv = new CSV_Manager(container)
  describe('#require()', function () {
    it('Should return an object when we require it.', function () {
      assert.isObject(csv)
    })
  })
  describe('#csv.getHeaders()', function(){
    it('Should be able to process headers consistently', function(done){
      csv.loadFile('https://www.mytestserver.com/data/18907011_channel_1.csv').then(_ => {
        var headers = csv.getHeaders()
        assert.equal(headers[4], 'Sweep 3_Membrane Potential (mV)')
        done()
      })
    })
  })
  describe('#csv.transposeSelf()', function(){
    it('Data should not change when transposed twice', function(){
      var originalData = csv.getAllData()
      csv.transposeSelf()
      csv.transposeSelf()
      assert.equal(originalData[3][3], csv.getAllData()[3][3])
    })
  })
  describe('#csv.getDataType()', function(){
    it('Should categorise data correctly', function(){
      assert.equal(csv.getDataType(), 'scatter')
    })
  })
})


describe('Plot Manager', function () {
  var plot = new PlotManager(container)
  var csv = new CSV_Manager(container)
  describe('#require()', function () {
    it('Should return an object when we require it.', function () {
      assert.isObject(plot)
    })
  })
  describe('#plot.createChart()', function(){
    it('Should be able to generate a chart', function(done){
        csv.loadFile('https://www.mytestserver.com/data/18907011_channel_1.csv').then(_ => {
        plot.createChart(csv.getColoumnByIndex(1), csv.getHeaderByIndex(1), 'id')
        done()
      })
      })
    })
  describe('#plot.resizePlot()', function(){
    it('Should find and resize the plot', function(){
      assert.isTrue(plot.resizePlot())
    })
  })
})
