var test = require('test');
var error = require("error");

var fixture = test.fixture();

fixture.addTest('raising', function() {
    test.throws(function() {
        error.raise({ msg : 'test'});
    });
});

fixture.execute();
