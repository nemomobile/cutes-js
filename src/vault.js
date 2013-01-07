/*
 * Backup tool
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

app.script.use("qt.core");
app.script.eval("sys.js");
app.script.eval("os.js");
app.script.eval("json2.js");
app.script.eval("util.js");


QByteArray.prototype.toString = function()
{
  var s = new QTextStream(this, QIODevice.ReadOnly);
  return s.readAll();
};

Date.prototype.toGitTag = function() {
    var res = this.toISOString();
    return res.replace(/:/g, '-');
};

var mk_git = function(storage_path) {
    var p = new QProcess();
    p.setWorkingDirectory(storage_path);

    var execute = function(params, can_fail) {
        print("git", params);
        p.start("git", params);
        p.waitForFinished();
        var rc = p.exitStatus();
        if (!can_fail && rc != QProcess.NormalExit)
            throw lib.error({ msg : "Git operation returned error",
                              params : params,
                              res : p.exitStatus(),
                              stderr : p.readAllStandardError()});
        return rc;
    };

    var rename_ops = { "R" : "R", "C" : "C" };

    var parse_status = function(items) {
        var res = [];
        for (var i = 0; i < items.length; ++i) {
            var s = String(items[i]);
            if (s.length < 1)
                continue;
            if (s.length < 4 && s[2] != " ")
                throw lib.error({ msg : "Unexpected status format, need XX ...",
                                  format : s });
            var item = { index : s[0], tree : s[1], src : s.substr(3) };
            if (rename_ops[item.index] || rename_ops[item.tree]) {
                ++i;
                if (i == items.length)
                    throw lib.error({ msg : "No dst after rename op",
                                      format : s});
                item.dst = items[i];
            }
            res.push(item);
        }
        return res;
    };

    var status = function(path, can_fail) {
        var params = ["status", "-z"];
        if (path && path != "")
            params = params.concat(["--", path]);
        var rc = execute(params, can_fail);
        if (rc == QProcess.NormalExit)
            return parse_status(p.readAllStandardOutput().split("\0"));
        else
            return rc;
    };
    var config = function(values, can_fail) {
        var rc;
        for (var k in values) {
            rc = execute(["config", k, values[k]], can_fail);
            if (rc != QProcess.NormalExit)
                return rc;
        };
        return QProcess.NormalExit;
    };

    return Object.create({
        status : status,
        config : config,
        init : function(can_fail) { return execute(['init'], can_fail); },
        ret_code : function() { return p.exitStatus(); },
        stdout : function() { return p.readAllStandardOutput(); },
        stderr : function() { return p.readAllStandardError(); }
    });
};

var mk_vault = function(path) {

    var git = mk_git(path);
    var storage = new QDir(path + "/.git");

    var init = function(config) {
        if (!lib.os.mkdir(path))
            throw lib.error({ msg : "Can't init vault",
                              path : path,
                              reason : "directory already exists" });

        try {
            if (!storage.exists() && !git.init())
                throw lib.error({ msg : "Can't init git",
                                  path : path,
                                  stderr : git.stderr()});
            git.config(config);
        } catch (err) {
            lib.os.system("rm", "-rf", path);
            throw err;
        }
    };

    var start_time;

    var backup_module = function(name, config) {
        var mod_root = path + "/" + name;
        var mod_data = mod_root + "/data";
        var mod_blobs = mod_root + "/blobs";
        var mkdir = lib.os.mkdir;
        mkdir(mod_root);
        mkdir(mod_data);
        mkdir(mod_blobs);
    };

    var backup = function(config, message) {
        start_time = new Date();
        var res = { succeeded :[], failed : [] };
        for (var name in config) {
            try {
                backup_module(name, config[name]);
                res.succeeded.push(name);
            } catch (err) {
                print("Failed to backup " + name + ", reason: " + err);
                res.failed.push(name);
            }
        }
        return res;
    };

    return Object.create({
        init : init,
        backup : backup
    });
};

var parse_git_config = function(cfg) {
    var res = {"status.showUntrackedFiles" : "all"};
    if (cfg) {
            var pairs = cfg.split(',');
        for (var i = 0; i < pairs.length; ++i) {
            var kv = pairs[i].split('=');
            if (kv.length == 2 && kv[0].length)
                res[kv[0]] = kv[1];
        }
    }
    return res;
};

(function() {
    var cmdline = lib.sys.optarg(app.script.args, {
        H : { name : "home", has_param : true, required : true },
        g : { name : "git_cfg", has_param : true },
        a : { name : "action", has_param : true, required : true },
        c : { name : "config_path", has_param : true },
        m : { name : "message", has_param : true}
    });

    var vault = mk_vault(cmdline.opts.home);
    var action = cmdline.opts.action;

    var modules_config = function() {
        var config = cmdline.opts.config_path;
        if (!config)
            throw lib.error({ msg : "Need config", action : action });
        return JSON.parse(lib.os.read_file(config));
    };
    switch (action) {
      case 'init':
        vault.init(parse_git_config(cmdline.opts.git_cfg));
        break;
      case 'backup':
        vault.backup(modules_config(), cmdline.opts.message);
        break;
      case 'restore':
        // TODO vault.restore(modules_config());
        break;
    default:
        throw lib.error({ msg : "Unknown action", action : action});
        break;
    }
    return "";
})();