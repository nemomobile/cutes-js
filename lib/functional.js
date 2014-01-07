/*
 * Basic functional programming support
 *
 * Copyright (C) 2013, 2014 Jolla Ltd.
 * Contact: Denis Zalevskiy <denis.zalevskiy@jollamobile.com>

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

var __slice = [].slice;

Function.prototype.method = function(name, func) {
    this.prototype[name] = func
    return this
};

var each = function(fn, arr) {
    var i;
    for (i = 0; i < arr.length; ++i)
        fn(arr[i]);
}

var map = function(fn, seq) {
    var i
    var res = []
    for (i = 0; i < seq.length; ++i)
        res.push(fn(seq[i]));
    return res;
};

var filter = function(fn, arr) {
    var i, item, res, len;
    len = arr.length;
    res = [];
    for (i = 0; i < len; ++i) {
        item = arr[i];
        if (fn(item))
            res.push(item);
    }
    return res;
};

var foldl = function(fn, acc, seq) {
    var res = typeof(acc) === 'object' ? Object.create(acc) : acc;
    each(function(e) { res = fn(res, e); }, seq);
    return res;
};

var curry = function(fn) {
    var head;
    head = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return function() {
        var tail;
        tail = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return fn.apply(null, head.concat(tail));
    };
};

var compose2 = function(fout, fin) {
    return function () {
        return fout(fin.apply(null, arguments));
    }
};

var compose = function() {
    var len = arguments.length;
    if (len === 1) {
        return arguments[0];
    } else if (len === 2) {
        return compose2.apply(null, arguments);
    } else if (len > 2) {
        var tail = __slice.call(arguments, 1);
        return compose2(arguments[0], compose.apply(null, tail));
    }
    return null;
};

Function.method('curry', function() {
    var head, that = this;
    head = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return function() {
        var tail;
        tail = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return that.apply(null, head.concat(tail));
    }
});

var eachProperty = function(fn, o) {
    for (var k in o)
        if (o.hasOwnProperty(k))
            fn(k, o[k]);
};

var eachPropertyUntil = function(fn, o) {
    var rc;
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            rc = fn(k, o[k]);
            if (rc)
                break;
        }
    }
    return rc;
};

var eachPropertyDeep = function(fn, o) {
    for (var k in o)
        fn(k, o[k]);
};

var dump = function(prefix, o, options) {
    var enumerate, dump_object,
    dump_fn, dump_not_obj, dump_default, get_name;

    options = options || {};

    enumerate = ((options.proto || options.deep)
                 ? eachPropertyDeep : eachProperty);

    get_name = function(n, o) {
        return [n, String(typeof o)].join(':');
    };

    dump_default = function(indent, n, v) {
            return [indent + get_name(n, v), v].join('=');
    };

    dump_not_obj = function(indent, n, v) {
        return (typeof v !== "function")
            ? dump_default(indent, n, v)
            : dump_fn(indent, n, v);
    };

    dump_fn = function(indent, n, v) {
        return options.fn_body
            ? dump_default(indent, n, v)
            : [indent + get_name(n, v), "() {...}"].join('=')
    };

    dump_object = function(indent, prefix, o) {
        var name = get_name(prefix, o);
        var lines = [[indent, name, '{'].join('')];
        var prev_indent = indent;
        indent += '  ';

        enumerate(function(n, v) {
            if (typeof v !== 'object') {
                lines.push(dump_not_obj(indent, n, v));
            } else {
                if (v != Object.prototype)
                    lines.push(dump_object(indent, n, v));
            }
        }, o);
        lines.push(prev_indent + '}');
        return lines.join('\n');
    };
    if (typeof o === 'object')
        return dump_object('', prefix, o);
    else
        return dump_not_obj('', get_name(prefix, o), o);
};

exports = {
    each : each,
    map : map,
    foldl : foldl,
    eachProperty : eachProperty,
    eachPropertyDeep : eachPropertyDeep
};
