var test = require('test');
var api = require("sys");

test.execute({
    empty : function() {
        var info = {};
        var args = [];
        var res;

        res = api.getopt(info).parse(args);
        test.ok('opts' in res, "Options");
        test.ok('params' in res, "Parameters");
    },
    short_ : function() {
        var info = { oA : { short_ : "A" } };
        var args = ['-A'];
        var res;

        res = api.getopt(info).parse(args);
        test.equal(res.opts.oA, true);
    },
    short_param_ : function() {
        var info = { oA : { short_ : "A", has_param : true } };
        var args = ['-A', 'some'];
        var res;

        res = api.getopt(info).parse(args);
        test.equal(res.opts.oA, 'some');
    },
    default_ : function() {
        var info = { oA : { short_ : "A", default_ : 33 } };
        var args = [];
        var res;

        res = api.getopt(info).parse(args);
        test.equal(res.opts.oA, 33);
    }
});
