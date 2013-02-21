var __slice = [].slice;

require('json/json2.js');

var that = function(data) {
    data.toString = function() {
        return JSON.stringify(data);
    };
    return data;
};

that.raise = function() {
    var args, info, item, name, value, _i, _len;
    info = arguments[0], args = 2 <= arguments.length
                              ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = args.length; _i < _len; _i++) {
        item = args[_i];
        for (name in item) {
            value = item[name];
            info[name] = value;
        }
    }
    throw that(info);
};

exports = that;

