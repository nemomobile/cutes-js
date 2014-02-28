var config = require('config');
config.document = true;
var test = require('test');
var api = require("functional");

var fixture = test.fixture();

fixture.addTest('visit', function() {
    var data = [];
    api.visit(function(ctx, k, v) {
        var kv;
        kv = ((typeof k === 'string') ? k : "")
            + ((typeof v === 'string') ? v : "");
        var res = ctx ? ctx + kv : kv;
        data.push(res);
        return res;
    }, { a : { b : 'c', d : 'e', f : ['g', 'h'] } });
    test.deepEqual(data, ["a","abc","ade","af","af0g","af1h"]);
});

fixture.addTest('functionStack', function() {
    var s = "";
    var fns = api.functionStack();
    fns.push(function() { s += '3'; });
    fns.push(function() { s += '2'; });
    fns.execute();
    test.equal(s, '23');
});

fixture.addTest('arrayToSet', function() {
    var res;
    res = api.arrayToSet([]);
    test.deepEqual(res, {});
    res = api.arrayToSet(['a', 'b']);
    test.deepEqual(res, {a: true, b: true});
    res = api.arrayToSet(['a', 'b', 'a']);
    test.deepEqual(res, {a: true, b: true});
});

fixture.addTest('mapObject', function() {
    var res;
    var toStr = function(value, key) {
        return String(key) + "," + value;
    };
    res = api.mapObject(toStr, {});
    test.deepEqual(res, []);

    res = api.mapObject(toStr, {x:1});
    test.deepEqual(res, ["x,1"]);

    res = api.mapObject(toStr, {x:1, y:3});
    res.sort();
    test.deepEqual(res, ["x,1", "y,3"]);
});

fixture.execute();
