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
  , append_file
  , root, sys, _;

subprocess = require('subprocess');
util = require('util');
debug = require('debug');
error = require('error');
sys = require('sys');
_ = require('functional');

var Q = require('qtcore');
var string = require('string');

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
    if (!f.open(Q.File.OpenMode.ReadOnly))
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
    if (!f.open(Q.File.OpenMode.WriteOnly))
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
    if (!f.open(Q.File.OpenMode.WriteOnly | Q.File.OpenMode.Append))
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
    that.mime = function(p) {
        var s = subprocess.check_output('file', ['--mime-type', p]).toString();
        var name_type = s.split(':');
        if (name_type.length !== 2)
            error.raise({msg: "Unexpected file --mime-type result"
                         , expected: "name: type", got: s});
        return name_type[1].trim();
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
        recursive: "r", force: "f", update: "u", deref: "L", no_deref: "P",
        hardlink: "l"
    };
    var long_options = {
        preserve: "preserve", no_preserve: "no-preserve"
        , overwrite: "remove-destination"
    };

    options = sys.command_line_options
    (options || {}, short_options, long_options
     , { preserve: true, no_preserve:true });

    return system("cp", options.concat([src, dst]));
};

update = function(src, dst, options) {
    options = options || {};
    options.update = true;
    return cp(src, dst, options);
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
    debug.debug("Rename", from, "to", to);
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
    return qdir(".").homePath();
};

root = function() {
    return qdir(".").rootPath();
};

var rm = function(path) {
    return system("rm", [path]);
};

var environ = function(name) {
    return name ? cutes.env[name] : cutes.env;
};

var get_block_size = function(cmd_name) {
    var res;
    var prefices = {df: "DF", du: "DU"};
    var prefix = prefices[cmd_name];
    var names = prefix ? [[prefix, "BLOCK_SIZE"].join('_')] : [];
    names = names.concat(["BLOCK_SIZE", "BLOCKSIZE"]);
    _.first(function(name) {
        var v = environ(name);
        if (v !== undefined) {
            res = parseInt(v);
            return true;
        }
        return false;
    }, names);
    return (res ? res : (environ("POSIXLY_CORRECT") ? 512 : 1024));
};

var mount = function() {
    var data = subprocess.check_output('cat', ['/etc/mtab']).toString();
    var lines = util.filter(data.split('\n'), function(line) {
        return (line.length > 0);
    });
    var names = ["src", "dst", "type", "options"];
    var line2obj = function(line) {
        var fields = line.split(/\s+/);
        return util.objFromPairs(util.zip(names, fields));
    };
    var split_options = function(obj) {
        obj.options = obj.options.split(',');
        return obj;
    };
    return util.map(util.map(lines, line2obj), split_options);
};

var mountpoint = function(path) {
    var commands = ['df -P ' + path, 'tail -1', "awk '{ print $NF}'"];
    var options = ['-c', commands.join(' | ')]
    var data = subprocess.check_output('sh', options).toString();
    return data.split('\n')[0];
};

/**
 * options.fields - sequence of characters used for field ids used by
 * stat (man 1 stat)
 */
var stat = util.wrap(function(path, options) {
    debug.debug("stat", util.dump(path, options));
    var that = this;
    options = options || {};

    if (typeof options.fields !== "string")
        error.raise({ msg : "Need to have fields set in options" });

    var commify = function(fields) {
        var res = [];
        util.forEach(fields, function(c) {
            res.push("%" + c);
        });
        return res.join(",");
    };
    options.format = commify(options.fields);

    var cmd_options = sys.command_line_options
    (options || {}, {}, that.long_options, that.have_params);
    cmd_options.push(path);

    var data = subprocess.check_output('stat', cmd_options).toString().trim();
    data = data.split(',');
    if (data.length !== options.fields.length)
        error.raise({ msg : "Fields set length != stat result length"
                      , fields : options.fields
                      , format : options.format
                      , result : data });

    var res = {}, i = 0;
    var fields = options.filesystem ? that.filesystem_fields : that.fields;
    util.forEach(data, function(value) {
        var c = options.fields[i++];
        var name = fields[c];
        if (!name)
            error.raise({ msg : "Can't find field name", id : c});
        if (c === 'm' && value === '?')
            value = mountpoint(path); // workaround if 'm' is not supported
        res[name] = value;
    });
    debug.debug("stat result", util.dump(path, res));
    return res;
}, { long_options : { filesystem : "file-system", format : "format" }
     , have_params : { format : true }
     , fields : { m : "mount_point",
                  b : "blocks",
                  B : "block_size",
                  s : "size" }
     , filesystem_fields : {
         b : "blocks",
         a : "free_blocks_user",
         f : "free_blocks",
         S : "block_size",
         n : "name"
     }
   });

var btrfs = function(path) {
    var kb_bytes = 1024;

    var df = function() {
        var cmd_options = ['-c', 'btrfs fi df ' + path];
        var data = subprocess.check_output('sh', cmd_options).toString();
        data = string.removeEmpty(data.trim().split('\n'));
        var name_fields = util.map(data, function(line) {
            return line.split(':');
        });
        name_fields = util.map(name_fields, function(nf) {
            var fields = nf[1];
            fields = fields.split(",");
            fields = util.map(fields, function(nv) {
                var res = nv.trim().split('=');
                res[1] = string.parseBytes(res[1], 'kb');
                return res;
            });
            fields = util.objFromPairs(fields);
            return [nf[0], fields];
        });
        return util.objFromPairs(name_fields);
    };

    var free = function() {
        debug.debug("btrfs.free for", path);
        s = stat(path, { fields: "bS", filesystem: true });
        var b = s.blocks, bs = s.block_size;
        var kb = bs / kb_bytes;
        var total = kb * b;
        var info = df();
        var all_used = util.mapObject(info, function(dummy, obj) {
            var used = util.mapObject(obj, function(k, bytes) {
                return (k === 'used') ? bytes : 0;
            });
            return _.foldl(function(acc, bytes) { return acc + bytes; }, 0, used);
        });
        var used = _.foldl(function(acc, v) { return (v ? acc + v : acc); }
                           , 0, all_used);
        return total - used;
    };

    return {
        df : df,
        free : free
    };
};


var diskFree = util.doc(function(path) {
    debug.debug("diskFree for", path);
    var s = stat(path, { fields: "m" });
    var mount_point = s.mount_point;
    if (mount_point === "?")
        mount_point = mountpoint();
    var mounts = util.mapByField(mount(), "dst");
    var info = mounts[mount_point];
    if (info === undefined)
        error.raise({ msg: "Can't find mount point"
                      , path: path
                      , mounts: mounts});
    var res = 0;
    if (info.type === "btrfs") {
        res = btrfs(mount_point).free();
    } else {
        s = stat(mount_point, { fields: "aS", filesystem: true });
        var b = s.free_blocks_user, bs = s.block_size;
        var kb = bs / 1024;
        res = kb * b;
    }
    debug.debug("diskFree for", path, "=", res);
    return res;
}, { params: { path: "Path inside filesystem"}
     , returns: "free disk space, Kb" });

var du = util.wrap(function(path, options) {
    var that = this;
    options = options || that.default_options;

    if (!options.block_size) // return usage in K
        options.block_size = "K";

    var cmd_options = sys.command_line_options
    (options, that.short_options, that.long_options, that.has_params);
    cmd_options.push(path);

    var data = subprocess.check_output('du', cmd_options).toString();
    data = string.removeEmpty(data.split('\n'));
    if (data.length === 1) {
        return parseInt(data[0]);
    } else {
        data = util.map(data, function(v) { return v.split(/\s/); });
        data = util.map(data, function(v) { return [parseInt(v[0]), v[1]]; });
        return util.objFromPairs(data, 1, 0);
    }
}, {
    short_options : { summarize: "s", one_filesystem : "x",  block_size: "B" }
    , long_options : {}
    , default_options : { summarize: true, one_filesystem: true, block_size: "K"}
    , has_params : { block_size: true }
}, {
    params: {
        path: "Path, can contain wildcards",
        options: {
            summarize: "Get total size",
            one_filesystem: "Do not cross fs border",
            block_size: "Block size (kB, K, MB, M...)"
        }
    },
    returns: "if summarize and no wildcards - total usage in Kb, "
        + "otherwise dictionary 'name'->'size, Kb'"
});

var mktemp = function(options) {
    options = options || {dir: false};
    var short_options = {
        dir: "d"
    };

    var cmd_options = sys.command_line_options(options, short_options);
    var res = subprocess.check_output('mktemp', cmd_options).toString();
    return res.trim();
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
    },
    environ: environ,
    stat : stat,
    du : du,
    mount: mount,
    mountpoint: mountpoint,
    diskFree: diskFree,
    btrfs : btrfs,
    mktemp : mktemp
});
