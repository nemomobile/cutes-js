var assert = require('narwhal/assert');
var debug = require('debug');

var that = Object.create(assert);


that.fixture = function() {
    var fixture, setups = [], teardowns = []
      , test_setups = [], test_teardowns = []
      , tests = [], count = 0
      , setup, teardown, run;

    fixture = Object.create(that);

    setup = function(fns) {
        for (var i = 0; i < fns.length; ++i) {
            fns[i].call(fixture);
        }
    };

    teardown = function(fns) {
        for (var i = 0; i < fns.length; ++i) {
            try {
                fns[i].call(fixture);
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

    fixture.addTestSetup = function(fn) {
        test_setups.push(fn);
        return fixture;
    };

    fixture.addTestTeardown = function(fn) {
        test_teardowns.push(fn);
        return fixture;
    };

    fixture.execute = function() {
        setup(setups);
        fixture.is_failed = false;

        try {
            for (var i = 0; i < tests.length; ++i)
                tests[i].execute();
        } finally {
            teardown(teardowns);
            debug.info("Executed " + count + " test(s)");
        }
        if (fixture.is_failed)
            throw "Test suite is failed";
    };

    fixture.addTest = function(name, fn) {
        var local_teardowns = [], test;

        if (typeof fn !== 'function')
            throw {msg : "Not a function", test : fn };

        var execute = function() {
            try {
                debug.debug("Setup for the test", name);
                setup(test_setups);
                debug.debug("Execute test", name);
                fn.call(test, fixture);
                ++count;
                return true;
            } catch (e) {
                debug.debug("Exception executing", name);
                var parts = [];
                for (var x in e)
                    if (e.hasOwnProperty(x))
                        parts.push(x + ": " + e[x]);

                debug.error("Test '" + name + "' is failed.");
                debug.error("Reason: " + e + "/" + parts.join(', '));
                debug.error("Stack:" + e.stack ? e.stack : "???");
                fixture.is_failed = true;
                return false;
            } finally {
                debug.debug("Teardown for the test", name);
                test.teardown();
                teardown(test_teardowns);
            }
        };
        test = Object.create({
            execute : execute,
            addTeardown : function(fn) { local_teardowns.push(fn); },
            teardown: function() { teardown(local_teardowns); }
        });
        tests.push(test);
    };

    return Object.create(fixture);
};

exports = that;
