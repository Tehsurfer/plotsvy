var Plotsvy = require("../../js/plotsvy");
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