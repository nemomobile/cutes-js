var test = require('test');
var os = require("os.js");

test.execute({
    path : function() {
        test.equal(os.path('/usr', 'bin'), '/usr/bin');
    },
    path_checks : function() {
        test.equal(os.path.exists('non_existing_file'), false);
        test.equal(os.path.exists(os.home()), true);

        test.equal(os.path.isdir(os.home()), true);
        test.equal(os.path.isdir('non_existing_file'), false);

        test.equal(os.path.isfile('./test_os.js'), true);
        test.equal(os.path.isfile('non_existing_file'), false);
    },
    file_io : function() {
        var data = 'a\nb'
          , fname = '/tmp/cutes_lib_test_aa';
        os.write_file(fname, data);
        test.equal(os.path.exists(fname), true);
        test.equal(os.path.isfile(fname), true);
        var read = os.read_file(fname);
        test.equal(read, data);
    }
});
