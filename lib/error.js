var __slice = [].slice;

require('json/json2.js');
require('util');
var debug = require('debug');

Error.method('toString', function() {
    return JSON.stringify(this);
});

var raise = function() {
    var err = new Error("Error");
    [].slice.call(arguments).each(function(obj) {
        obj.each(function(n, v) {
            err[n] = v;
        });
    });
    debug.error("Raise:", err);
    throw err;
};

exports = Object.create({
    raise : raise
});
