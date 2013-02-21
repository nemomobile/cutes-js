var test = require('test');
var error = require("error");

test.execute({
    raising : function() {
        test.throws(function() {
            error.raise({ msg : 'test'});
        });
    }
});
