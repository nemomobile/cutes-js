var config;

config = require('config');

exports.wrap = function(fn, obj, doc) {
    var self = Object.create(obj);
    var res = function() {
        return fn.apply(self, arguments);
    };
    res.__self__ = self;
    res.__fn__ = fn;
    if (config.document && doc !== undefined)
        res.__doc__ = doc;
    return res;
};

var doc_ = function(fn, doc) {
    fn.__doc__ = doc;
    return fn;
}

exports.doc = (config.document ? doc_ : function(fn, doc) { return fn; });

