var assert = require('narwhal/assert');
var debug = require('debug');

var that = Object.create(assert);


that.fixture = function() {
    var fixture = Object.create(that);
    var setups = [], teardowns = [];
    var count = 0;

    var run = function(name, test) {
        try {
            test(fixture);
            ++count;
        } catch (e) {
            var parts = [];
            for (var x in e)
                if (e.hasOwnProperty(x))
                    parts.push(x + ": " + e[x]);
            debug.error("Test '" + name + "' is failed.");
            debug.error("Reason: " + parts.join(', '));
            fixture.is_failed = true;
            throw e;
        }
    };

    var setup = function(tests) {
        for (var i = 0; i < setups.length; ++i) {
            setups[i].call(fixture);
        }
    };

    var teardown = function(tests) {
        for (var i = 0; i < teardowns.length; ++i) {
            try {
                teardowns[i].call(fixture);
            } catch(e) {
                debug.error("Exception on teardown " + i + ":" + e);
            }
        }
    };

    fixture.addSetup = function(fn) {
        setups.push(fn);
        return fixture;
    };

    fixture.addTeardown = function(fn) {
        teardowns.push(fn);
        return fixture;
    };

    fixture.execute = function(tests) {
        setup(tests);
        fixture.is_failed = false;
        try {
            for (var name in tests) {
                var test = tests[name];
                if (tests.hasOwnProperty(name) && typeof test === 'function')
                    run(name, test);
            }
        } finally {
            teardown(tests);
            debug.info("Executed " + count + " test(s)");
        }
    };
    return fixture;
};

// execute tests w/o setup
that.execute = function(tests) {
    var fixture = that.fixture();
    return fixture.execute(tests);
};

exports = that;
