var __slice = [].slice;

require('json/json2.js');
require('util');
var debug = require('debug');

Error.method('toString', function() {
    return JSON.stringify(this);
});

var CutesError = function(args) {
    var that = this;
    args.each(function(obj) {
        obj.each(function(n, v) {
            that[n] = v;
        });
    });
    debug.error("Raise:", that.toString());
};

CutesError.prototype = new Error;
CutesError.prototype.name = "CutesError";

var raise = function() {
    throw new CutesError(__slice.call(arguments));
};

exports = Object.create({
    raise : raise,
});
