var __slice = [].slice;

require('json/json2.js');
require('util');

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
    throw err;
};

exports = Object.create({
    raise : raise
});
