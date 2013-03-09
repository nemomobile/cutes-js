var __slice = [].slice;

require('json/json2.js');
require('util');

var raise = function() {
    var error = Object.create({
        toString : function() {
            return JSON.stringify(error);
        }
    });
    [].slice.call(arguments).each(function(obj) {
        obj.each(function(n, v) {
            error[n] = v;
        });
    });
    throw error;
};

exports = Object.create({
    raise : raise
});
