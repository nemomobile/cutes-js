var test = require('test');
var util = require("util");

test.execute({
    array_each : function() {
        var s = "";
        ['a', 'b', 'c'].each(function(v) {
            s += v;
        });
        test.equal(s, 'abc');
    },
    object_each : function() {
        var s = "";
        var obj = { a : 1, b : 2, c : 3 };
        obj.each(function(name, value) {
            s += (name + String(value));
        });
        test.equal(s, 'a1b2c3');
    },
    cons : function() {
        test.deepEqual(util.cons(), []);
        test.deepEqual(util.cons(1), [1]);
        test.deepEqual(util.cons(1, [2, 3]), [1, 2, 3]);
        test.deepEqual(util.cons([1, 2]), [[1, 2]]);
        test.deepEqual(util.cons([1, 2], [3, 4]), [[1, 2], 3, 4]);
        test.deepEqual(util.cons(1, [2, 3, 4], [5, 6]), [1, 2, 3, 4]);
    }
});
