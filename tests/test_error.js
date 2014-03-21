var test = require('test');
var error = require("error");

var fixture = test.fixture();

fixture.addTest('raising', function() {
    test.throws(function() {
        error.raise({msg : 'test'});
    });
});

fixture.addTest('error_data', function() {
    var res;
    var caught = false;
    try {
        error.raise({message : 'test', aux: 1});
    } catch (e) {
        res = e;
        caught = true;
    }
    test.ok(caught, "Should be raised");
    test.ok(res instanceof Error, "Should be Error");
    test.equal(res.message, 'test');
    test.equal(res.aux, 1);
});

fixture.execute();
