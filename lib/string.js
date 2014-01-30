var util = require('util');
var error = require('error');

var removeEmpty = function(arr) {
    return util.filter(arr, function(line) {
        if (typeof(line) !== 'string')
            error.raise({ msg: "Not a string", arr: arr, element: line });
        return (line.length !== 0);
    });
};

var capacityUnitExponent = util.wrap(function(name) {
    var that = this;
    var suffix = name.toLowerCase().trim();
    if (!/^([kmgtpezy]?)i?b?$/.test(suffix))
        error.raise({ msg: "Wrong bytes unit format"
                      , value: value, suffix: suffix });

    if (name === 'b')
        return 0;

    var exp = that.multipliers[suffix[0]];
    if (exp === undefined)
        error.raise({ msg: "Wrong bytes unit multiplier"
                      , value: value, suffix: suffix });
    return exp;
}, {
    multipliers : { k : 1, m : 2, g : 3, t : 4, p : 5, e : 6, z : 7, y : 8 }
});

var parseBytes = function(value, unit, multiplier) {
    unit = unit || 'b';
    multiplier = multiplier || 1024;

    value = value.trim();
    var num_end = value.search(/[^0-9.,]/);
    var res;
    if (num_end === -1) {
        res = parseFloat(value);
    } else {
        res = parseFloat(value.slice(0, num_end));
        var exp = capacityUnitExponent(value.slice(num_end));

        if (unit && unit.length)
            exp -= capacityUnitExponent(unit);

        if (multiplier === 1024 || multiplier === undefined) {
            multiplier = Math.pow(1024, exp);
        } else if (multiplier === 1000) {
            multiplier = Math.pow(1000, exp);
        }
        res = res * multiplier;
    }
    return res;
};

exports = {
    removeEmpty : removeEmpty,
    parseBytes : parseBytes
};
