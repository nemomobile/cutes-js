var test = require('test');
var util = require('util');
var os = require("os.js");
var time = require('time');
var debug= require('debug');
// debug.level('debug');
var _ = require('functional');

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

fixture.addTest('dirEntryOps', function() {
    var fname = os.path(rootDir, 'cutes_lib_test_dirent_unlink');
    os.write_file(fname, "...");
    test.ok(os.path.exists(fname));
    os.unlink(fname);
    test.ok(!os.path.exists(fname));
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


fixture.addTest('entryInfoList', function() {
    var dirForList = os.path(rootDir, "entryInfoList")
    test.ok(os.mkdir(dirForList), "dirForList for tests is created");
    var f1 = os.path(dirForList, "f1"), f2 = os.path(dirForList, "f2");

    var d = os.qt.dir(dirForList);
    var Q = require('qtcore');
    os.write_file(f1, "1");
    var entries = d.entryInfoList(["*"], Q.Dir.Filter.Files, Q.Dir.SortFlag.NoSort);
    test.equal(entries.length, 1);
    test.equal(entries[0].fileName(), "f1");

    os.write_file(f2, "2");
    entries = d.entryInfoList(["*"], Q.Dir.Filter.Files, Q.Dir.SortFlag.Name);
    test.equal(entries.length, 2);
    test.equal(entries[0].fileName(), "f1");
    test.equal(entries[1].fileName(), "f2");
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

fixture.addTest('cp', function() {
    var rc;
    var p1 = os.path(rootDir, 'cp1');
    var p2 = os.path(rootDir, 'cp2');
    os.write_file(p1, "1");
    test.equal(os.read_file(p1).toString(), "1");
    rc = os.cp(p1, p2);
    test.equal(rc, 0);
    test.ok(os.path.exists(p1));
    test.ok(os.path.exists(p2));
    test.equal(os.read_file(p2).toString(), "1");
    os.write_file(p2, "2");
    os.update(p1, p2);
    test.equal(os.read_file(p2).toString(), "2");
    var p3 = os.path(rootDir, 'cp3');
    os.update(p1, p3);
    test.ok(os.path.exists(p3));
    test.equal(os.read_file(p3).toString(), "1");
});

fixture.addTest('rename', function() {
    var rc;
    var p1 = os.path(rootDir, 'rename1');
    var p2 = os.path(rootDir, 'rename2');
    os.write_file(p1, "1");
    test.ok(os.path.isFile(p1));
    os.rename(p1, p2);
    test.ok(os.path.isFile(p2));
    test.ok(!os.path.isFile(p1));
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

fixture.addTest('environ', function() {
    var env = os.environ();
    test.equal(typeof(env), 'object', "environ should be an object");
    test.ok(env['HOME'] !== undefined);
    test.equal(typeof(env['HOME']), 'string');
    var home = os.home();
    test.equal(env['HOME'], home);
});

fixture.addTest('mountpoint', function() {
    var home = os.home();
    var mp = os.mountpoint(home);
    test.equal(typeof(mp), 'string', "mountpoint should be string");
    test.ok(os.path.isDescendent(home, mp));
});

fixture.addTest('mime', function() {
    var home = os.home();
    test.ok(os.path.isDir(home), "Can't execute test with current home:" + home);
    var mime = os.path.mime(home);
    test.equal(typeof(mime), 'string', "mime should be string");
    test.equal(mime, "inode/directory", "Home is dir and should have corresponding mime type");

});

fixture.addTest('mount', function() {
    var res = os.mount();
//    print(util.dump("MOUNT", res));
    //print(util.dump("MPOINTS", util.mapByField(res, 'dst')));
});

fixture.addTest('stat', function() {
    var env = os.environ();
    test.throws(function() { os.stat(os.home()); }, null, "Should throw");

    var info = os.stat(os.home(), { fields : "ms" });
    test.equal(typeof(info), 'object', 'stat()->object');
    test.equal(typeof(info.mount_point)
               , 'string', util.dump("No mount point:", info));
    test.ok(os.path.isDir(info.mount_point), "mount point is dir");
    test.ge(parseInt(info.size), 1, util.dump("Size is wrong:", info));
    info = os.stat(info.mount_point, { filesystem : true, fields : "abS" });
    var blocks = parseInt(info.blocks)
    , bsize = parseInt(info.blocks_size)
    , free_blocks = parseInt(info.free_blocks_user);
    test.ge(parseInt(blocks), 1, util.dump("No blocks:", info));
    test.ge(bsize, 1, util.dump("Block size > 0:", info));
    test.ge(free_blocks, 1, util.dump("Free blocks > 0:", info));
    test.ge(blocks, free_blocks, util.dump("Total >= Free", info));
});

fixture.addTest('diskFree', function() {
    var res = os.diskFree(os.path(os.home()));
    test.equal(typeof(res), 'number', "diskFree->number");
    test.ge(res, 1, "Most probably free space > 0");
});


fixture.addTest('du', function() {
    var test_dir = os.path(rootDir, 'du');
    os.mkdir(test_dir);
    os.system("dd", ["if=/dev/zero", "of=" + os.path(test_dir, "a")
                     , "bs=1024", "count=2"]);
    var res = os.du(test_dir);
    test.equal(typeof res, "number");
    test.ge(parseInt(res), 1, "du should be a number > 0");
    os.system("dd", ["if=/dev/zero", "of=" + os.path(test_dir, "b")
                     , "bs=1024", "count=100"]);
    res = os.du(test_dir);
    test.ge(parseInt(res), 100, "du should be a number > 100");

    var dir_c = os.path(test_dir, 'c');
    os.mkdir(dir_c);
    res = os.du(test_dir, { summarize: false });
    test.equal(typeof(res), 'object', util.dump("Object is expected", res));
    _.eachProperty(function(v, k) {
        test.ok(os.path.isDescendent(k, test_dir), "Should be descendent: " + k
               + " of " + test_dir);
        test.equal(typeof v, "number");
    }, res);
});

fixture.addTest('mktemp', function() {
    var name = os.mktemp();
    test.equal(typeof(name), 'string', "Temp file name is not a string: " + name);
    test.ok(os.path.isFile(name), "Should be file:" + name);
    os.rm(name);
    name = os.mktemp({dir: true});
    test.equal(typeof(name), 'string', "Temp dir name is not a string: " + name);
    test.ok(os.path.isDir(name), "Should be dir:" + name);
    os.rmtree(name);
});

fixture.execute();
