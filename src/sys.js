(function() {
    var options = function(argv, info) {
        var params = [];
        var opts = {};

        var help = function() {
            var line = "Usage: " + argv[0] + " " + argv[1];
            for (var k in info) {
                var v = info[k];
                var name = v.name;
                var desc = " -" + (k.length > 1 ? "-" + k : k) + " ";
                if (v.has_param)
                    desc += ("<" + name + ">");
                line += desc;
            }
            print(line);
        };

        var addopt = function(name, value) {
            if (!(name in info)) {
                help();
                throw lib.error({ msg : "Unknown option " + name});
            }
            opts[info[name].name] = value;
        };

        var getopt = function(i, name) {
            ++i;
            if (i >= argv.length)
                throw lib.error({ msg : "Expected value", option : name});
            var v = argv[i];
            if (v[0] == '-')
                throw lib.error({ msg: "Expected value",
                                  option : name, got : v });
            addopt(name, v);
            return i;
        };

        var name;
        for (var i = 0; i < argv.length; ++i) {
            var a = argv[i];
            if (a[0] != '-') {
                params.push(a);
            } else if (a.length > 2 && a[1] == '-') {
                i = getopt(i, a.substr(2));
            } else {
                name = a.substr(1, 2);
                if (a.length > 2) {
                    addopt(name, a.substr(2));
                } else {
                    i = getopt(i, name);
                }
            }
        }
        for (var k in info) {
            var v = info[k];
            if ('required' in v && v.required && !(v.name in opts)) {
                help();
                throw lib.error({msg : "Option is required", option : + v.name});
            }
        }
        return { opts : opts, params : params };
    };
    lib.sys = { optarg : options };
}).call(this);
