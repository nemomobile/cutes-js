/*
 * Working with processes
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
    if (lib.subprocess)
        return;

    qtscript.use("qt.core")
    qtscript.eval("util.js")

    var that = {};
    var qprocess = function() { return new QProcess() }

    that.process = function(presets) {
        var p = qprocess()
        var that = { stdout : function() { return p.readAllStandardOutput() },
                     stderr : function() { return p.readAllStandardError() },
                     returncode : function() { return p.exitCode() }
                   }
        if (presets) {
            var cwd = presets['cwd']
            if (cwd)
                p.setWorkingDirectory(cwd)
        }

        that.popen = function(cmd, args) {
            p.start(cmd, args || [])
            return p
        }

        that.system = function(cmd, args) {
            var p = that.popen(cmd, args)
            p.waitForFinished()
            return p
        }

        that.call = function(cmd, args) {
            return that.system(cmd, args).exitCode()
        }

        var check_call = function(cmd, args) {
            var p = that.system(cmd, args)
            if (p.exitCode())
                throw lib.error({ msg : "Process returned non-zero",
                                  cmd : cmd,
                                  args : args,
                                  rc : p.exitCode(),
                                  stderr : p.readAllStandardError()});
            return p.exitCode();
        }

        that.check_call = function(cmd, args) {
            return check_call(cmd, args)
        }

        that.check_output = function(cmd, args) {
            var p = check_call(cmd, args)
            return p.readAllStandardOutput();
        }
        return that;
    }

    var wrapper = function(name) {
        return function(cmd, args) {
            var p = that.process()
            return p[name](cmd, args)
        }
    }

    var names = ['popen', 'call', 'check_call', 'check_output']
    lib.util.foreach(names, function(name) {
        that[name] = wrapper(name)
    })

    lib.subprocess = that
})(this);
