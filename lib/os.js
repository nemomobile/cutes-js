/*
 * OS interface functions
 *
 * Copyright (C) 2012, 2013 Jolla Ltd.
 * Contact: Denis Zalevskiy <denis.zalevskiy@jollamobile.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.

 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.

 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301 USA
 *
 * http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 */

var cptree, cp, update, debug, error, home, mkdir, qbytearray
  , qdir, qfile, qfileinfo, read_file, rename, rmtree, subprocess
  , symlink, system, unlink, update_tree, util, write_file
  , root, sys;

subprocess = require('subprocess');
util = require('util');
debug = require('debug');
error = require('error');
sys = require('sys');
var Q = require('qtcore');

qdir = function(path) {
    if (typeof path !== 'string')
        error.raise({msg : "Dir path is not string", path : path});
    return new Q.Dir(path);
};

qfileinfo = function(path) {
    return new Q.FileInfo(path);
};

qfile = function(path) {
    return new Q.File(path);
};

qbytearray = function(data) {
    var res = new Q.ByteArray();
    res.append(data);
    return res;
};

mkdir = function(path, options) {
    debug.debug('mkdir', path);
    var d, name, the_err;
    the_err = {
        fn: 'mkdir',
        path: path
    };
    options = options || {};
    if (options.parent) {
        return exports.system("mkdir", ["-p", path]) == 0;
    }
    d = qdir(path);
    if (d.exists()) {
        return false;
    }
    name = d.dirName();
    if (!d.cdUp()) {
        error.raise(the_err, {
            msg: "Parent dir is unaccesible"
        });
    }
    if (!d.mkdir(path)) {
        error.raise(the_err, {
            msg: "Can't create " + name,
            path: d.path()
        });
    }
    return true;
};

read_file = function(file_name) {
    var f;
    f = qfile(file_name);
    if (!f.open(Q.IODevice.ReadOnly))
        return 0;
    try {
        return f.readAll();
    } finally {
        f.close();
    }
};

write_file = function(file_name, data) {
    var f;
    f = qfile(file_name);
    if (!f.open(Q.IODevice.WriteOnly))
        return 0;
    try {
        return f.write(qbytearray(data));
    } finally {
        f.close();
    }
};

append_file = function(file_name, data) {
    var f;
    f = qfile(file_name);
    if (!f.open(Q.IODevice.WriteOnly | Q.IODevice.Append))
        return 0;
    try {
        return f.write(qbytearray(data));
    } finally {
        f.close();
    }
};

var mk_path = function() {
    // unix specific
    var that = function() {
        var len = arguments.length, elements;
        if (!len)
            return "";

        if (len === 1)
            return arguments[0];

        switch (arguments[0]) {
            case (""): {
                if (len !== 1)
                    elements = [].slice.call(arguments, 1);
                else
                    return "";
                break;
            }
            case ("/"): {
                elements = [].slice.call(arguments, 0);
                elements[0] = "";
                break;
            }
            default: {
                elements = [].slice.call(arguments, 0);
                break;
            }
        }
        return elements.join('/');
    };
    that.exists = function(p) {
        return qfileinfo(p).exists();
    };
    that.isfile = that.isFile = function(p) {
        return qfileinfo(p).isFile();
    };
    that.isdir = that.isDir = function(p) {
        return qfileinfo(p).isDir();
    };
    that.isexec = that.isExec = function(p) {
        return qfileinfo(p).isExecutable();
    };
    that.isSymLink = function(p) {
        return qfileinfo(p).isSymLink();
    };
    that.lastModified = function(p) {
        return qfileinfo(p).lastModified();
    };
    that.setLastModified = function(p, timeval) {
        return system('touch', ['-d', timeval.toString(), p]);
    };
    that.relative = function(p, dir) {
        return qdir(dir).relativeFilePath(p);
    };
    that.dirname = that.dirName = function(p) {
        return qfileinfo(p).dir().path();
    };
    that.filename = that.fileName = function(p) {
        return qfileinfo(p).fileName();
    };
    that.basename = that.baseName = function(p) {
        return qfileinfo(p).baseName();
    };
    that.suffix = function(p) {
        return qfileinfo(p).suffix();
    };
    that.completeSuffix = function(p) {
        return qfileinfo(p).completeSuffix();
    };
    // applicable to existing paths only
    that.canonical = function(p) {
        return qfileinfo(p).canonicalFilePath();
    };
    that.deref = function(p) {
        return qfileinfo(p).symLinkTarget();
    };
    // applicable to existing paths only
    that.isSame = function(p1, p2) {
        p1 = that.canonical(p1);
        p2 = that.canonical(p2);
        return p1 === p2;
    };
    // applicable to existing paths only
    that.isSelf = function(p) {
        return that.isSame(that.dirName(p), p);
    };
    that.isDescendent = function(p, other) {
        var tested = that.split(that.canonical(p));
        var pivot = that.split(that.canonical(other));

        // hardlinks?
        if (pivot.length > tested.length)
            return false;
        for (var i = 0; i < pivot.length; ++i) {
            if (pivot[i] !== tested[i])
                return false;
        }
        return true;
    };
    that.split = function(p) {
        var res = p.split('/');
        var len  = res.length;

        if (len <= 1)
            return res;

        if (res[0] === '')
            res[0] = '/';

        return util.filter(res, function(v) { return v !== ''; });
    };

    return that;
};

var path = mk_path();

cp = function(src, dst, options) {
    var short_options = {
        recursive: "r", force: "f", update: "u", deref: "L", no_deref: "P"
    };
    var long_options = { preserve: "preserve", no_preserve: "no-preserve" };

    options = sys.command_line_options
    (options || {}, short_options, long_options
     , { preserve: true, no_preserve:true });

    return system("cp", options.concat([src, dst]));
};

update = function(src, dst, options) {
    options = options || {};
    options.update = true;
};

// options = {preserve: "comma-separated cp --preserve options",
// deref: boolean (is dereference symlinks)}
cptree = function(src, dst, options) {
    var cmd_options;

    options = options || {};

    options.recursive = true;
    options.force = true;
    return cp(src, dst, options);
};

rename = function(from, to) {
    return qdir(path.dirname(from)).rename(from, to);
};

system = function(cmd, args) {
    return subprocess.call_rc(cmd, args || []);
};

symlink = function(tgt, link) {
    return system("ln", ["-s", tgt, link]);
};

unlink = function(what) {
    // use shell call now. TODO replace with native
    return system("unlink", [what]);
    //return qdir(path.dirname(what)).remove(what);
};

// options = {preserve: "comma-separated cp --preserve options"}
update_tree = function(src, dst, options) {
    options = options || {};
    options.deref = true;
    options.recursive = true;
    return update(src, dst, options);
};

rmtree = function(path) {
    return system("rm", ["-rf", path]);
};

home = function() {
    return Q.Dir.homePath();
};

root = function() {
    return Q.Dir.rootPath();
};

var rm = function(path) {
    return system("rm", [path]);
};

exports = Object.create({
    mkdir: mkdir,
    read_file: read_file,
    write_file: write_file,
    append_file: append_file,
    system: system,
    rmtree: rmtree,
    cp: cp,
    cptree: cptree,
    update_tree: update_tree,
    update: update,

    treeUpdate: update_tree,
    treeRemove: rmtree,
    treeCopy: cptree,
    fileRead: read_file,
    fileWrite: write_file,
    fileAppend: append_file,

    rm : rm,
    path: path,
    rename: rename,
    unlink: unlink,
    symlink: symlink,
    home: home,
    root: root,
    qt: {
        dir: qdir,
        file: qfile,
        fileInfo: qfileinfo
    }
});
