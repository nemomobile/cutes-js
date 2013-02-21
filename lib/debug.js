var levels = { debug : 1, info : 2, warning : 3,
               error : 4, critical : 5 }
var name

var current_level = levels["error"]
var debug = {
    level : function(name) {
        var i = levels[name]
        if (i === undefined)
            error.raise({msg: "unknown debug level", name : name })
        current_level = i
    }
}

var mk_log = function(level) {
    return function() {
        if (level >= current_level)
            print ([].slice.call(arguments))
    }
}
for (name in levels)
    debug[name] = mk_log(levels[name])
exports = debug
