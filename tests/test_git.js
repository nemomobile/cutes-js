var git = require('git.js');
var os = require('os.js');
var util = require('util.js');
var assert = require('test');

var test_dir = '/tmp/test-git';
os.rmtree(test_dir);
os.mkdir(test_dir);
var vcs = git(test_dir);

assert.execute({
    init : function() {
        vcs.init();
    },
    config : function() {
        var uname = 'User Name', umail = 'email@user.com';
        vcs.config.set({'user.name' : uname, 'user.email' : umail});
        assert.equal(vcs.config.get('user.name'), uname);
        assert.equal(vcs.config.get('user.email'), umail);
    },
    add : function() {
        os.write_file(os.path(test_dir, 'a'), '1');
        assert.equal(vcs.status().toString(), "?? a");
        vcs.add("a");
        assert.equal(vcs.status().toString(), "A  a");
    },
    add2 : function() {
        os.write_file(os.path(test_dir, 'b'), '2');
        assert.equal(vcs.status().toString(), "A  a,?? b");
    },
    commit : function() {
        vcs.commit("about a");
        assert.equal(vcs.status().toString(), "?? b");
    },
    rename : function() {
        var src = vcs.path('a');
        assert.equal(src.absolute, [test_dir, 'a'].join('/'));
        assert.equal(src.relative, 'a');
        assert.equal(src.path('b').relative, ['a', 'b'].join('/'));

        var dst = vcs.path('A');
        assert.equal(dst.relative, 'A');
        os.rename(src.absolute, dst.absolute)
        assert.equal(vcs.status().toString(), " D a,?? A,?? b");
        vcs.rm('a')
        assert.equal(vcs.status().toString(), "D  a,?? A,?? b");
        vcs.add('A');
        assert.equal(vcs.status().toString(), "R  A a,?? b");
    },
    commit2 : function() {
        var status;
        vcs.add('b');
        status = vcs.status();
        assert.equal(status.toString(), "R  A a,A  b");
        status.each(function(status) {
            assert.equal(status.isClean(), false);
            assert.equal(status.isTreeClean(), true);
        });
        vcs.commit('A+b');
        status = vcs.status();
        assert.equal(status.length, 0);
    }

});
