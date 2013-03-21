var test = require('test');
var os = require("os.js");
var ps = require('subprocess');

test.execute({
    basic : function() {
        var home = os.home();
        test.notEqual(home.length, 0);
        test.equal(home, qtscript.env['HOME']);
        test.equal(os.root(), '/'); // unix only
    },
    path : function() {
        test.equal(os.path(), '');
        test.equal(os.path('', '/'), '/');
        test.equal(os.path('/'), '/');
        test.equal(os.path('/', 'usr'), '/usr');
        test.equal(os.path('/usr', 'bin'), '/usr/bin');

        test.equal(os.path.relative('/usr/bin', '/usr'), 'bin');

        test.deepEqual(os.path.split('/'), ['/']);
        test.deepEqual(os.path.split('//'), ['/']);
        test.deepEqual(os.path.split('/usr//bin'), ['/', 'usr', 'bin']);
        test.deepEqual(os.path.split('/usr//bin/'), ['/', 'usr', 'bin']);
        test.deepEqual(os.path.split('/usr///bin/'), ['/', 'usr', 'bin']);
        test.deepEqual(os.path.split('usr///bin'), ['usr', 'bin']);
    },
    file_io : function() {
        var data = 'a\nb'
          , fname = '/tmp/cutes_lib_test_aa';
        os.write_file(fname, data);
        test.equal(os.path.exists(fname), true);
        test.equal(os.path.isfile(fname), true);
        var read = os.read_file(fname);
        test.equal(read, data);
    },
    path_checks : function() {
        test.equal(os.path.exists('non_existing_file'), false);
        test.equal(os.path.exists(os.home()), true);

        test.equal(os.path.isdir(os.home()), true);
        test.equal(os.path.isdir('non_existing_file'), false);

        test.equal(os.path.isfile('./test_os.js'), true);
        test.equal(os.path.isfile('non_existing_file'), false);

        test.ok(os.path.isSame('/tmp', '/tmp/../tmp', "absolute and relative"));

        ps.system('touch', ['/tmp/cutes_lib_test_file1']);
        ps.system('ln' , ['-s', '/tmp/cutes_lib_test_file1'
                          , '/tmp/cutes_lib_test_link1']);
        test.ok(os.path.isSymLink('/tmp/cutes_lib_test_link1'), "Should be link");

    }
    }
});
