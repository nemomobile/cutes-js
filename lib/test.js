require('util');
var assert = require('node/assert');

var that = Object.create(assert);

that.execute = function(tests) {
    tests.each(function(name, test) {
        try {
            test();
        } catch (e) {
            print("Test '" + name + "' is failed: " + e);
            throw e;
        }
    });
};

exports = that;
