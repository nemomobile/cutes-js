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
    },
    map : function() {
        test.deepEqual(util.map([], function(v) { return v; }), []);
        test.deepEqual(util.map([1, 2, 3], function(v) { return v + 1; })
                       , [2, 3, 4]);
    },
    filter : function() {
        test.deepEqual(util.filter([], function(v) { return true; }), []);
        test.deepEqual(util.filter([], function(v) { return false; }), []);
        test.deepEqual(util.filter([1, 2, 3, 4]
                                   , function(v) { return v % 2; })
                       , [1, 3]);
        test.deepEqual(util.filter([1, 2, 3, 4]
                                   , function(v) { return !(v % 2); })
                       , [2, 4]);
    },
    first : function() {
        var is2 = function(v) { return v === 2; };
        test.equal(util.first([], is2), 0);
        test.equal(util.first([1, 2, 3, 2] , is2), 1);
        test.equal(util.first([1, 2, 3, 2], is2, 0), 1);
        test.equal(util.first([1, 2, 3, 2], is2, 1), 1);
        test.equal(util.first([1, 2, 3, 2], is2, 2), 3);
        test.equal(util.first([1, 1, 3, 3], is2), 4);
        test.equal(util.first([1, 1, 3, 3], is2, 2), 4);
        test.equal(util.first([1, 1, 3, 3], is2, 5), 5);
    },
    curry : function() {
        var plus = function(x, y) { return x + y; };
        var plus1 = plus.curry(1);
        var plus2 = plus.curry(2);
        test.equal(plus1(1), 2);
        test.equal(plus2(1), 3);

        // several values to be curried
        var in_range = function(x, y, v) { return (x <= v) && (v <= y); };
        var gt2 = in_range.curry(2);
        test.equal(gt2(4, 3), true);
        test.equal(gt2(4, 5), false, "outside");
        test.equal(gt2(4, 1), false);
    },
    stream : function() {
        var a0 = []
          , a1 = [1]
          , a2 = [1, 2, 3, 2];
        var s;
        s = util.stream(a0);
        test.equal(s.end(), true);
        test.deepEqual(s.map(function(s) { return s.next() + 1; }), []);
        a0.push(1);
        test.equal(s.end(), false);
        test.deepEqual(s.map(function(s) { return s.next() + 1; }), [2]);
    }
});
