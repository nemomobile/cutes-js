/*
 * Git support
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

var subprocess = require("subprocess.js")
var util = require("util.js")
var debug = require('debug.js')
var error = require('error.js')
var os = require('os.js')

var rename_ops = { "R" : "R", "C" : "C" }

var status_item = {
    isClean : function() {
        return (this.index === ' ' && this.tree === ' ');
    },
    isTreeClean : function() { return this.tree === ' ' },
    toString : function() {
        return (this.isRename()
               ? [this.index + this.tree, this.dst, this.src]
               : [this.index + this.tree, this.src]).join(' ');
    },
    init : function(s) {
        this.index = s[0];
        this.tree = s[1];
        this.src = s.substr(3);
    },
    isRename : function() {
        return (rename_ops[this.index] || rename_ops[this.tree]);
    }
}

var parse_next_status = function(stream) {
    var s = stream.next();
    if (s.length < 4 && s[2] != " ")
        error.raise({
            msg : "Unexpected status format, need XX ...",
            format : s });
    var item = Object.create(status_item);
    item.init(s);
    if (item.isRename()) {
        if (stream.end())
            error.raise({ msg : "No dst after rename op", format : s });
        item.dst = item.src;
        item.src = stream.next();
    }
    return item;
};

var parse_status = function(items) {
    items = util.map(items, String);
    items = util.filter(items, function(v) { return v.length > 0; });
    return util.stream(items).map(parse_next_status);
};

var factory = function(storage_path) {
    var that;
    var ps = subprocess.process({ cwd : storage_path })

    var execute = function(cmd, params, can_fail) {
        debug.debug("git", cmd, params)
        var fn = can_fail ? ps.call : ps.check_call
        return fn('git', params ? [cmd].concat(params) : [cmd])
    }

    var status = function(path, can_fail) {
        var params = ["-z"]
        if (path && path != "")
            params = params.concat(["--", path])
        var rc = execute('status', params, can_fail)
        return (rc ? rc : parse_status(ps.stdout().split("\0")));
    }

    var add = function(path, params, can_fail) {
        params = params || []
        return execute('add', params.concat([path]), can_fail)
    }

    var rm = function(path, params, can_fail) {
        params = params || []
        return execute('rm', params.concat([path]), can_fail)
    }

    var commit = function(msg, params, can_fail) {
        params = params || []
        return execute('commit', params.concat(['-m', msg]), can_fail)
    }

    var set_config = function(values, can_fail) {
        return values.until(function(k, v) {
                   return execute('config', [k, v], can_fail);
               });
    }

    var basic_cmd = function(name) {
        return function(params, can_fail) {
            return execute(name, params, can_fail)
        }
    }

    var exec_stdout = function(name, params, can_fail) {
        if (params === undefined)
            params = []
        var rc = execute(name, params, can_fail)
        return (rc ? undefined : ps.stdout())
    }

    var text_cmd = function(name) {
        return function(params, can_fail) {
            return exec_stdout(name, params, can_fail)
        }
    }

    var getline = function() {
        var rc = execute.apply(null, [].slice.call(arguments))
        return (rc ? undefined
               : ps.stdout().split('\n')[0].toString().trim())
    }

    var hash_object = function(path) {
        return getline('hash-object', [path])
    }

    var get_config = function(name) {
        return getline('config', [name]);
    };

    var rev_parse = function(rev) {
        return getline('rev-parse', [rev])
    }

    var tag = function(params, can_fail) {
        return execute('tag', params || [], can_fail)
    }

    var checkout = function(commit, params, can_fail) {
        params = params || []
        return execute('checkout', [commit].concat(params), can_fail)
    }

    var path = function() {
        var root = that.root()
          , args = [].slice.call(arguments);
        return Object.create({
            absolute : os.path.apply(null, util.cons(root, args)),
            relative : os.path.apply(null, arguments),
            path : function() {
                return path.apply(
                    null, util.cons(this.relative, [].slice.call(arguments)));
            }
        });
    };

    var tags = function() {
        that.tag([]);
        return ps.stdout().toString().split('\n');
    };

    var notes = Object.create({
        execute : text_cmd('notes'),
        get : function(treeish) {
            var data = notes.execute(['show', treeish], true) || "";
            return data.toString().trim();
        },
        add : function(msg) { notes.execute(['add', '-m', msg]); }
    });

    that = Object.create({
        status : status,
        config : { set : set_config, get : get_config },
        add : add,
        rm : rm,
        commit : commit,
        init : basic_cmd('init'),
        reset : basic_cmd('reset'),
        clean : basic_cmd('clean'),
        hash_object : hash_object,
        rev_parse : rev_parse,
        tag : tag,
        tags : tags,
        checkout : checkout,
        show : text_cmd('show'),
        notes : notes,
        execute : execute, // any git command
        returncode : function() { return ps.returncode(); },
        stdout : function() { return ps.stdout(); },
        stderr : function() { return ps.stderr(); },
        root : function() { return storage_path; },
        path : path
    });
    return that;
}

exports = factory
