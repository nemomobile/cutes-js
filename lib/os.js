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

var cptree, debug, error, home, mkdir, path, qbytearray
  , qdir, qfile, qfileinfo, read_file, rename, rmtree, subprocess
  , symlink, system, that, unlink, update_tree, util, write_file
  , __slice = [].slice;

subprocess = require('subprocess.js');
util = require('util.js');
debug = require('debug.js');
error = require('error.js');
qtscript.extend('qt.core');

qdir = function(path) {
    return new QDir(path);
};

qfileinfo = function(path) {
    return new QFileInfo(path);
};

qfile = function(path) {
    return new QFile(path);
};

qbytearray = function(data) {
    return new QByteArray(data);
};

that = {};

mkdir = function(path) {
    var d, name, the_err;
    the_err = {
        fn: 'mkdir',
        path: path
    };
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
    f.open(QIODevice.ReadOnly);
    try {
        return f.readAll();
    } finally {
        f.close();
    }
};

write_file = function(file_name, data) {
    var f;
    f = qfile(file_name);
    f.open(QIODevice.WriteOnly);
    try {
        return f.write(qbytearray(data));
    } finally {
        f.close();
    }
};

path = (function() {
    that = function() {
        var elements;
        elements = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return elements.join('/');
    };
    that.exists = function(p) {
        return qfileinfo(p).exists();
    };
    that.isfile = function(p) {
        return qfileinfo(p).isFile();
    };
    that.isdir = function(p) {
        return qfileinfo(p).isDirectory();
    };
    that.relative = function(p, dir) {
        return qdir(dir).relativeFilePath();
    };
    that.dirname = function(p) {
        return qfileinfo(p).dir().path();
    };
    return that;
}).call(this);

cptree = function(src, dst, isDeref) {
    var opts;
    opts = ["-rfu", src, dst];
    if (isDeref) {
        opts.push('-L');
    }
    return that.system("cp", opts);
};

rename = function(from, to) {
    return qdir(path.dirname(from)).rename(from, to);
};

system = function(cmd, args) {
    return subprocess.call(cmd, args);
};

symlink = function(tgt, link) {
    return system("ln", ["-s", tgt, link]);
};

unlink = function(what) {
    return qdir(path.dirname(what)).remove(what);
};

update_tree = function(src, dst) {
    return system("cp", ["-rfuL", src, dst]);
};

rmtree = function(path) {
    return system("rm", ["-rf", path]);
};

home = function() {
    return QDir.homePath();
};

exports = Object.create({
    mkdir: mkdir,
    read_file: read_file,
    write_file: write_file,
    system: system,
    rmtree: rmtree,
    cptree: cptree,
    update_tree: update_tree,
    path: path,
    rename: rename,
    unlink: unlink,
    symlink: symlink,
    home: home,
    qt: {
        dir: qdir,
        file: qfile
    }
})
