var test = require('test');
var os = require("os.js");

test.execute({
    path : function() {
        test.equal(os.path('/usr', 'bin'), '/usr/bin');
    }
});
