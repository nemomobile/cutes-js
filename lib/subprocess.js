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

var Process = Q.Process;
var qprocess = function() { return new Process() }

var errors_;

var process = function(presets) {
    var p = qprocess(); // do not expose
    var that;

    var get_error = function() {
        if (!errors_) {
            errors_ = {};
            errors_[Process.FailedToStart] = "FailedToStart";
            errors_[Process.Crashed] = "Crashed";
            errors_[Process.Timedout] = "Timedout";
            errors_[Process.WriteError] = "WriteError";
            errors_[Process.ReadError] = "ReadError";
            errors_[Process.UnknownError] = "UnknownError";
        };
        var e = p.error(), status = p.exitStatus();
        // TODO get rid of workaround. QProcess status reporting is
        // non-consistent: if process was not started because
        // executable does not exists exitStatus will be NormalExit :(
        // If process was started successfully error will be
        // UnknownError. It seems the only way is to track error()
        // signal.
        return (status === Process.NormalExit && e == Process.UnknownError
                ? undefined : errors_[e]);
    };

    var check_error = function(ctx) {
        var err, rc;

        err = get_error();
        rc = that.rc();
        if (err) {
            err = ctx ? Object.create(ctx) : {};
            err.message = "Program was not started";
            err.error = err;
            rc = -1;
        } else if (rc) {
            err = ctx ? Object.create(ctx) : {};
            err.message = "Program returned rc != 0";
            err.rc = rc;
            err.stdout = that.stdout().toString();
            err.stderr = that.stderr().toString();
        }
        if (err) {
            error.raise(err);
            debug.error(util.dump("ERR", err));
        }
        return rc;
    };

    that = {
        stdout : function() { return p.readAllStandardOutput() },
        stderr : function() { return p.readAllStandardError() },
        rc : function() { return p.exitCode() },
        wait : function(timeout) {
            var t = (timeout !== undefined && timeout >= 0) ? timeout : -1;
            return (p.waitForFinished(t) ? true : p.state() == Process.NotRunning);
        },
        error : get_error,
        write : function(data) {
            return p.write(data);
        },
        stdin : { close : function() { return p.closeWriteChannel(); }},
        check_error : check_error
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

    that.popen_sync = function(cmd, args) {
        debug.debug('[popen]', cmd, args);
        p.start(cmd, args || []);
        p.waitForStarted(-1);
        return res;
    }

    that.system = function(cmd, args) {
        that.popen(cmd, args);
        p.waitForFinished(-1);
        return res;
    }

    that.call_rc = function(cmd, args) {
        return that.system(cmd, args).rc();
    }

    var check_call = function(cmd, args) {
        that.system(cmd, args);
        if ((p.exitStatus() != Process.NormalExit) || p.exitCode()) {
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
