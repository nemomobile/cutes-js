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
    var mkdir = function(path) {
        var d = new QDir(path);
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

    var system = function(cmd) {
        var p = new QProcess();
        p.start(cmd, [].slice.call(arguments, 1));
        p.waitForFinished();
        return p.exitStatus();
    };

    var read_file = function(file_name) {
        var f = new QFile(file_name);
        f.open(QIODevice.ReadOnly);
        try {
            return f.readAll();
        } finally {
            f.close();
        }
    };

    lib.os = {
        mkdir : mkdir,
        system : system,
        read_file : read_file
    };
}).call(this);
