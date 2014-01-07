var test = require('test');
var string = require("string");

var fixture = test.fixture();

fixture.addTest('parseBytes', function() {
    var res = string.parseBytes('10');
    test.equal(res, 10, "plain bytes");
    var res = string.parseBytes('10K');
    test.equal(res, 1024 * 10, "10K");
    var res = string.parseBytes('20Kb');
    test.equal(res, 1024 * 20, "10Kb");
    var res = string.parseBytes('30kib');
    test.equal(res, 1024 * 30, "30Kb");
    var res = string.parseBytes(' 40 kb ');
    test.equal(res, 1024 * 40, "40K");

    test.throws(string.parseBytes.curry(' 10 k b '));

    var res = string.parseBytes('50mb');
    test.equal(res, 1024 * 1024 * 50, "50mb");

    var res = string.parseBytes('60Mib', 'b', 1000);
    test.equal(res, 1000 * 1000 * 60, "60Mib");

    var res = string.parseBytes('70mb', 'mb');
    test.equal(res, 70, "70mb");

    var res = string.parseBytes('1024kb', 'mb');
    test.equal(res, 1, "1mb");

    var res = string.parseBytes('1024kb', 'GB');
    test.le(res, 1 / 1024, "1024kb=xGb");

});

fixture.execute();
