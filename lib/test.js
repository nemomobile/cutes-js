var assert = require('narwhal/assert');

var that = Object.create(assert);

that.execute = function(tests) {
    for (var name in tests) {
        if (tests.hasOwnProperty(name)) {
            var test = tests[name];
            try {
                test();
            } catch (e) {
                var parts = [];
                for (var x in e)
                    if (e.hasOwnProperty(x))
                        parts.push(x + ": " + e[x]);
                print("Test '" + name + "' is failed: " + parts.join(', '));
                throw e;
            }
        }
    }
};

exports = that;
