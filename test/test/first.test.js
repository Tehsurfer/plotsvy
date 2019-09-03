var Plotsvy = require("../../js/plotsvy");
var assert = require('chai').assert;
const container = window.document.querySelector("#container");

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});


describe('Plotsvy', function () {
  var plotsvy = new Plotsvy(container)
  describe('#require()', function () {
    it('Should return an object when we require it.', function () {
      assert.isObject(plotsvy)
    });
  });
  describe('#openCSV()', function () {
    it('Should update the state to the given url', function () {
      plotsvy.openCSV('https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/stellate/sample_1/cell_1/18907011_channel_1.csv').then(_ => {
        var state = plotsvy.exportState()
        assert.equal(state.url, 'https://mapcore-bucket1.s3-us-west-2.amazonaws.com/ISAN/csv-data/stellate/sample_1/cell_1/18907011_channel_1.csv')
      })
    });
  })
});