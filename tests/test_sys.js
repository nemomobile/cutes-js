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

fixture.addTest('command_line_options', function() {
    var res;
    var options, short_options, long_options, options_has_param;

    var before = function() {
        options = null;
        short_options = null;
        long_options = null;
        options_has_param = null;
    };

    var execute = function() {
        res = api.command_line_options
        (options, short_options, long_options, options_has_param);
    };

    before();
    options = {opt_a: 2, opt_b: 3};
    short_options = { opt_a: "a", opt_b: "b"};
    execute();
    test.ok(res);
    test.deepEqual(res, ["-a", "-b"]);

    before();
    options = {opt_a: 2, opt_b: 3, opt_c: 4};
    short_options = { opt_a: "a", opt_b: "b"};
    options_has_param = {opt_b: true}
    execute();
    test.ok(res);
    test.deepEqual(res, ["-a", "-b", 3]);

    before();
    options = {opt_a: 2, opt_b: 3};
    short_options = { opt_a: "a", opt_b: "b", opt_c: "c"};
    options_has_param = {opt_b: true}
    execute();
    test.ok(res);
    test.deepEqual(res, ["-a", "-b", 3]);

    before();
    options = {opt_a: 2, opt_b: 3};
    short_options = { opt_a: "a", opt_b: "b", opt_c: "c"};
    options_has_param = {opt_b: true, opt_c: true}
    execute();
    test.ok(res);
    test.deepEqual(res, ["-a", "-b", 3]);

    before();
    options = {opt_a: 2, opt_b: 3, opt_c: 4};
    short_options = { opt_a: "a", opt_b: "b", opt_c: "c"};
    options_has_param = {opt_b: true, opt_c: true}
    execute();
    test.ok(res);
    test.deepEqual(res, ["-a", "-b", 3, "-c", 4]);

    before();
    options = {opt_a: 2, opt_b: 3, opt_c: 4};
    long_options = {opt_a: "is-a", opt_c: "is-c"};
    execute();
    test.ok(res);
    test.deepEqual(res, ["--is-a", "--is-c"]);

    before();
    options = {opt_a: 2, opt_b: 3, opt_c: 4};
    long_options = {opt_a: "is-a", opt_c: "is-c"};
    options_has_param = {opt_c: true, opt_b: true}
    execute();
    test.ok(res);
    test.deepEqual(res, ["--is-a", "--is-c=4"]);

});

fixture.execute();
