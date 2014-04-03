var __slice = [].slice;

require('json/json2.js');
require('util');
var debug = require('debug');

Error.method('toString', function() {
    return JSON.stringify(this);
});

var raise = function() {
    var args = __slice.call(arguments);
    var that = new Error("Cutes error");
    args.each(function(obj) {
        obj.each(function(n, v) {
            that[(n === "msg") ? "message" : n] = v;
        });
    });
    debug.error("Raise:", that.toString());
    throw that;
};

exports = Object.create({
    raise : raise,
});
