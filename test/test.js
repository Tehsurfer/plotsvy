var plotsvy = require("../../js/plotsvy");
const fetch = require("node-fetch");
const assert = require('assert');

var preRenderCallback = function() {
    return function() {
      it('PreRenderCallbackFunction',function() 
        {assert.isTrue(true, 'PreRenderCallbackFunction is successfully called');}
      );
    }
  }