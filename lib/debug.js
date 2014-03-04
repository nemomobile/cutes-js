var Q = require('qtcore');
var util = require("util");

var levels = { debug : 1, info : 2, warning : 3,
               error : 4, critical : 5 }
var name

var current_level = parseInt(cutes.env["CUTES_DEBUG"]) || levels["error"];

var dst = undefined;
var dst_fname = undefined;

var close = function() {
    if (dst_fname !== undefined) {
        dst.close();
        dst_fname = undefined;
    }
};

var open = function(fname) {
    dst = new Q.File(fname);
    if (!dst.open(Q.IODevice.WriteOnly))
        throw {msg: "Can't open output", dst: fname};
    dst_fname = fname;
    return dst;
};

var debug = {
    level : function(name) {
        var i = levels[name]
        if (i === undefined) {
            debug.print("unknown debug level'" + name + "'")
            i = 5
        }
        current_level = i
    },
    print: fprint.curry(2),
    output: function(dst) {
        if (typeof dst === "string") {
            if (dst_fname === dst)
                return;

            close();
            debug.print = fprint.curry(open(dst));
        } else if (typeof dst === "number") {
            debug.print = fprint.curry(dst);
        }
    }
}

var mk_log = function(level) {
    return function() {
        if (level >= current_level)
            debug.print.apply(null, [].slice.call(arguments))
    }
}
for (name in levels)
    debug[name] = mk_log(levels[name])
exports = debug
