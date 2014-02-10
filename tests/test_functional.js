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

fixture.execute();
