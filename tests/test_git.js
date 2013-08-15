var git = require('git.js');
var os = require('os.js');
var util = require('util.js');
var test = require('test');

var test_dir;
var vcs;

var fixture = test.fixture();

fixture.addSetup(function() {
    test_dir = '/tmp/.cutes-test-git-f1f6f3868167b337dea6a229de1f3f4a';
    os.rmtree(test_dir);
    os.mkdir(test_dir);
});

fixture.addTestSetup(function() { vcs = git(test_dir); });

fixture.addTest('init', function() {
    vcs.init();
});

fixture.addTest('config', function() {
    var uname = 'Test User', umail = 'email@user.com';
    vcs.config.set({'user.name' : uname, 'user.email' : umail});
    test.equal(vcs.config.get('user.name'), uname);
    test.equal(vcs.config.get('user.email'), umail);
});

fixture.addTest('add', function() {
    os.write_file(os.path(test_dir, 'a'), '1');
    test.equal(vcs.status().toString(), "?? a");
    vcs.add("a");
    test.equal(vcs.status().toString(), "A  a");
});

fixture.addTest('add2', function() {
    os.write_file(os.path(test_dir, 'b'), '2');
    test.equal(vcs.status().toString(), "A  a,?? b");
});

fixture.addTest('commit', function() {
    vcs.commit("about a");
    test.equal(vcs.status().toString(), "?? b");
});

fixture.addTest('rename', function() {
    var src = vcs.path('a');
    test.equal(src.absolute, [test_dir, 'a'].join('/'));
    test.equal(src.relative, 'a');
    test.equal(src.path('b').relative, ['a', 'b'].join('/'));

    var dst = vcs.path('A');
    test.equal(dst.relative, 'A');
    os.rename(src.absolute, dst.absolute)
    test.equal(vcs.status().toString(), " D a,?? A,?? b");
    vcs.rm('a')
    test.equal(vcs.status().toString(), "D  a,?? A,?? b");
    vcs.add('A');
    test.equal(vcs.status().toString(), "R  A a,?? b");
});

fixture.addTest('commit2', function() {
    var status;
    vcs.add('b');
    status = vcs.status();
    test.equal(status.toString(), "R  A a,A  b");
    status.each(function(status) {
        test.equal(status.isClean(), false);
        test.equal(status.isTreeClean(), true);
    });
    vcs.commit('A+b');
    status = vcs.status();
    test.equal(status.length, 0);
});

fixture.execute();
