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

fixture.addTest('path_checks', function() {
    test.equal(os.path.exists('non_existing_file'), false);
    test.equal(os.path.exists(os.home()), true);

    test.equal(os.path.isdir(os.home()), true);
    test.equal(os.path.isdir('non_existing_file'), false);

    test.equal(os.path.isfile('./test_os.js'), true);
    test.equal(os.path.isfile('non_existing_file'), false);

    test.ok(os.path.isSame('/tmp', '/tmp/../tmp', "absolute and relative"));

    var ln_tgt = '/tmp/cutes_lib_test_file1', ln = '/tmp/cutes_lib_test_link1';
    os.system('touch', [ln_tgt]);
    os.system('ln' , ['-s', ln_tgt, ln]);
    test.ok(os.path.isSymLink(ln), "Should be link");
    test.equal(os.path.deref(ln), ln_tgt);
});

fixture.addTest('mkdir', function() {
    test.ok(!os.path.exists(rootDir)
            , "Test root dir " + rootDir + " should not exist");
    test.throws(os.mkdir);
    test.ok(os.mkdir(rootDir), "creating root for tests");
    fixture.addTeardown(function() {
        if (!fixture.is_failed) os.rmtree(rootDir);
    });
    test.ok(os.path.exists(rootDir), "root dir is created");
    test.ok(os.path.isDir(rootDir), "created root dir");
    test.ok(!os.mkdir(rootDir), "root for tests is created, expecting false");

    var dtree = os.path(rootDir, 'w', 'e');
    test.throws(os.mkdir.curry(dtree));
    test.ok(os.mkdir(dtree, { parent: true }));
    test.ok(os.path.exists(dtree), "dir with parent is created");
    test.ok(os.path.isDir(dtree), "created dir");
});

fixture.addTest('file_io', function() {
    var data = 'a\nb'
    , fname = os.path(rootDir, 'cutes_lib_test_aa');
    os.write_file(fname, data);
    test.equal(os.path.exists(fname), true);
    test.equal(os.path.isfile(fname), true);
    var read = os.read_file(fname).toString();
    test.equal(read, data);
    var dplus = "\nc";
    os.append_file(fname, dplus);
    data += dplus;
    read = os.read_file(fname).toString();
    test.equal(read, data);

    // append to non-existent file
    var fname2 = os.path(rootDir, 'cutes_lib_test_aa2');
    os.append_file(fname2, data);
    read = os.read_file(fname2).toString();
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

fixture.addTest('fileInfo', function() {
    var dname = "path_info";
    var d = os.path(rootDir, dname);
    test.equal(os.path.fileName(d), dname);
    test.equal(os.path.baseName(d), dname);
    test.equal(os.path.dirName(d), rootDir);
    test.equal(os.path.suffix(d), "");
    test.equal(os.path.completeSuffix(d), "");
    os.mkdir(d);
    var ddot = os.path(d, ".");
    test.equal(os.path.canonical(ddot), d);
    test.ok(os.path.isSelf(ddot));
    test.ok(!os.path.isSelf(d));
    var ddots = os.path(d, "..", ".", dname);
    test.equal(os.path.canonical(ddots), d);

    test.ok(os.path.isDescendent(d, rootDir));
    test.ok(!os.path.isDescendent(rootDir, d));
    test.ok(os.path.isDescendent(os.path(d, "..", dname), rootDir));

    var base = "test_file";
    var suffix = "e2";
    var completeSuffix = "e1." + suffix;
    var name1 = base + "." + completeSuffix;
    var f1 = os.path(d, name1);
    test.equal(os.path.fileName(f1), name1);
    test.equal(os.path.baseName(f1), base);
    test.equal(os.path.suffix(f1), suffix);
    test.equal(os.path.completeSuffix(f1), completeSuffix);
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
