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

var util = require("util")
var debug = require("debug")
var error = require("error")
var Q = require("qtcore")
// debug.level('debug');

var qprocess = function() { return new Q.Process() }

var process = function(presets) {
    var p = qprocess(); // do not expose

    var that = {
        stdout : function() { return p.readAllStandardOutput() },
        stderr : function() { return p.readAllStandardError() },
        rc : function() { return p.exitCode() }
    };
    // compatibilty
    that.returncode = that.rc;
    var res = that;

    if (presets) {
        var cwd = presets['cwd']
        if (cwd)
            p.setWorkingDirectory(cwd)
    }

    that.popen = function(cmd, args) {
        debug.debug('[popen]', cmd, args);
        p.start(cmd, args || []);
        return res;
    }

    that.system = function(cmd, args) {
        that.popen(cmd, args);
        p.waitForFinished(30000);
        return res;
    }

    that.call_rc = function(cmd, args) {
        return that.system(cmd, args).rc();
    }

    var check_call = function(cmd, args) {
        that.system(cmd, args);
        if ((p.exitStatus() != Q.Process.NormalExit) || p.exitCode()) {
            debug.error(that.stderr())
            error.raise({ msg : "Process returned non-zero",
                          cmd : cmd,
                          args : args.toString ? args.toString() : args,
                          rc : p.exitCode(),
                          status : p.exitStatus(),
                          stderr : that.stderr().toString(),
                          stdout : that.stdout().toString()})
        }
        return p.exitCode();
    }

    that.check_call = function(cmd, args) {
        return check_call(cmd, args);
    }

    that.check_output = function(cmd, args) {
        check_call(cmd, args);
        return res.stdout();
    }
    return that;
};

exports.process = process;

var wrapper = function(name) {
    return function(cmd, args) {
        var p = process()
        return p[name](cmd, args)
    }
}

var names = ['popen', 'call_rc', 'check_call', 'check_output', 'system'];
util.forEach(names, function(name) {
    exports[name] = wrapper(name)
})
