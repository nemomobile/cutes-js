var test = require('test');
var api = require("sys");

var fixture = test.fixture();

fixture.addTest('empty', function() {
    var info = {};
    var args = [];
    var res;

    res = api.getopt(info).parse(args);
    test.ok('opts' in res, "Options");
    test.ok('params' in res, "Parameters");
});

fixture.addTest('short_', function() {
    var info = { oA : { short_ : "A" } };
    var args = ['-A'];
    var res;

    res = api.getopt(info).parse(args);
    test.equal(res.opts.oA, true);
});

fixture.addTest('short_param_', function() {
    var info = { oA : { short_ : "A", has_param : true } };
    var args = ['-A', 'some'];
    var res;

    res = api.getopt(info).parse(args);
    test.equal(res.opts.oA, 'some');
});

fixture.addTest('default_', function() {
    var info = { oA : { short_ : "A", default_ : 33 } };
    var args = [];
    var res;

    res = api.getopt(info).parse(args);
    test.equal(res.opts.oA, 33);
});

fixture.execute();
