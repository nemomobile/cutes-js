var test = require('test');
var util = require('util');
var os = require("os.js");
var time = require('time');
// var debug= require('debug');
// debug.level('debug');

var rootDir = '/tmp/.cutes-js-test-f1f6f3868167b337dea6a229de1f3f4a';

var fixture = test.fixture();

fixture.addTest('basic', function() {
    var home = os.home();
    test.notEqual(home.length, 0);
    test.equal(home, cutes.env['HOME']);
    test.equal(os.root(), '/'); // unix only
});

fixture.addTest('mkdir', function() {
    test.ok(!os.path.exists(rootDir)
            , "Test root dir " + rootDir + " should not exist");
    test.throws(os.mkdir);
    test.ok(os.mkdir(rootDir), "creating root for tests");
    fixture.addTeardown(function() {
        if (!fixture.is_failed) os.rmtree(rootDir);
    });
    test.ok(!os.mkdir(rootDir), "root for tests is created, expecting false");
    test.throws(os.mkdir.curry(os.path(rootDir, 'w', 'e')));
});

fixture.addTest('path', function() {
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
});

fixture.addTest('file_io', function() {
    var data = 'a\nb'
    , fname = '/tmp/cutes_lib_test_aa';
    os.write_file(fname, data);
    test.equal(os.path.exists(fname), true);
    test.equal(os.path.isfile(fname), true);
    var read = os.read_file(fname).toString();
    test.equal(read, data);
});

fixture.addTest('entryInfoList', function() {
    var dirForList = os.path(rootDir, "entryInfoList")
    test.ok(os.mkdir(dirForList), "dirForList for tests is created");
    var f1 = os.path(dirForList, "f1"), f2 = os.path(dirForList, "f2");
    var d = os.qt.dir(dirForList);
    var Q = require('qtcore');
    os.write_file(f1, "1");
    var entries = d.entryInfoList(["*"], Q.Dir.Files);
    test.equal(entries.length, 1);
    test.equal(entries[0].fileName(), "f1");

    os.write_file(f2, "2");
    var entries2 = d.entryInfoList(["*"], Q.Dir.Files, Q.Dir.Name);
    test.equal(entries2.length, 2);
    test.equal(entries2[0].fileName(), "f1");
    test.equal(entries2[1].fileName(), "f2");
});

fixture.addTest('path_checks', function() {
    test.equal(os.path.exists('non_existing_file'), false);
    test.equal(os.path.exists(os.home()), true);

    test.equal(os.path.isdir(os.home()), true);
    test.equal(os.path.isdir('non_existing_file'), false);

    test.equal(os.path.isfile('./test_os.js'), true);
    test.equal(os.path.isfile('non_existing_file'), false);

    test.ok(os.path.isSame('/tmp', '/tmp/../tmp', "absolute and relative"));

    os.system('touch', ['/tmp/cutes_lib_test_file1']);
    os.system('ln' , ['-s', '/tmp/cutes_lib_test_file1'
                      , '/tmp/cutes_lib_test_link1']);
    test.ok(os.path.isSymLink('/tmp/cutes_lib_test_link1'), "Should be link");

});

fixture.addTest('fileTime', function() {
    var fname = '/tmp/cutes_lib_test_time';
    os.fileWrite(fname, '1');
    var t1 = os.path.lastModified(fname);
    time.sleep(1100); // formatted time precision is seconds
    os.fileWrite(fname, '1');
    var t2 = os.path.lastModified(fname);
    test.notEqual(t1.toString(), t2.toString(), "Test precondition");
    os.path.setLastModified(fname, t1);
    var t3 = os.path.lastModified(fname);;
    test.equal(t3.toString(), t1.toString(), "Time is not set correctly?");
});

fixture.addTest('tree', function() {
    var treeRootSrc = os.path(rootDir, 'treeTestSrc');
    os.mkdir(treeRootSrc);

    var treeRootDst = os.path(rootDir, 'treeTestDst');
    os.mkdir(treeRootSrc);

    var f1 = os.path(treeRootSrc, 'f1');
    var f2 = os.path(treeRootSrc, 'f2');
    os.write_file(f1, '1');
    os.write_file(f2, '2');

    os.cptree(os.path(treeRootSrc, '.'), treeRootDst);
    test.ok(os.path.isFile(os.path(treeRootDst, 'f1')));
    test.ok(os.path.isFile(os.path(treeRootDst, 'f2')));

    os.symlink(f1, os.path(treeRootSrc, 'link'));
    os.cptree(os.path(treeRootSrc, '.'), treeRootDst);
    test.ok(os.path.isSymLink(os.path(treeRootDst, 'link')));

    os.cptree(os.path(treeRootSrc, '.'), treeRootDst, {deref: true});
    test.ok(os.path.isFile(os.path(treeRootDst, 'link')));
});

fixture.execute();
