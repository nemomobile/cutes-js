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

(function() {
    if (lib.os)
        return;

    var qdir = function(path) { return new QDir(path) }
    var qfileinfo = function(path) { return new QFileInfo(path) }
    var qfile = function(path) { return new QFile(path) }

    var mkdir = function(path) {
        var d = qdir(path);
        if (d.exists())
            return false;

        var name = d.dirName();
        if (!d.cdUp())
            throw lib.error({ msg : "mkdir: Parent dir is unaccesible",
                              path : path });
        if (!d.mkdir(path))
            throw lib.error({ msg : "Can't create " + name, path :  d.path()});
        return true;
    };

    var read_file = function(file_name) {
        var f = qfile(file_name);
        f.open(QIODevice.ReadOnly);
        try {
            return f.readAll();
        } finally {
            f.close();
        }
    };

    var write_file = function(file_name, data) {
        var f = qfile(file_name);
        f.open(QIODevice.WriteOnly);
        try {
            return f.write(new QByteArray(data));
        } finally {
            f.close();
        }
    };

    var path = (function() {
        var that = function() { return [].slice.call(arguments).join('/') }

        that.exists = function(p) { return qfileinfo(p).exists() }
        that.isfile = function(p) { return qfileinfo(p).isFile() }
        that.isdir = function(p) { return qfileinfo(p).isDirectory() }
        that.relative = function(p, dirname) {
            return qdir(dirname).relativeFilePath(p)
        }
        that.dirname = function(p) {
            return qfileinfo(p).dir().path()
        }
        return that;
    })();

    lib.os = {
        mkdir : mkdir,
        read_file : read_file,
        write_file : write_file,
        system : function(cmd, args) { return lib.subprocess.call(cmd, args) },
        rmtree : function (path) { return lib.os.system("rm", ["-rf", path]) },
        path : path,
        rename : function(from, to) {
            lib.debug.debug("MV", from, to)
            return qdir(path.dirname(from)).rename(from, to)
        },
        unlink : function(what) { return qdir(path.dirname(what)).remove(what) },
        symlink : function(tgt, link) {
            lib.debug.debug("LN", tgt, link)
            return lib.os.system("ln", ["-s", tgt, link])
        }
    };
}).call();
