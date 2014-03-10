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
var doc = require('doc');
doc = doc.doc;

Function.prototype.method = function(name, func) {
    this.prototype[name] = func
    return this
};

var each = function(fn, arr) {
    var i;
    for (i = 0; i < arr.length; ++i)
        fn(arr[i], i);
}

var map = function(fn, seq) {
    var i
    var res = []
    for (i = 0; i < seq.length; ++i)
        res.push(fn(seq[i], i));
    return res;
};

var first = function(fn, arr, start) {
    var i, len = arr.length;
    for (i = (start || 0); i < len; ++i)
        if (fn(arr[i]))
            break;
    return i;
};

var filter = function(fn, arr) {
    var i, item, res, len;
    len = arr.length;
    res = [];
    for (i = 0; i < len; ++i) {
        item = arr[i];
        if (fn(item, i))
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
            fn(o[k], k);
};

var eachPropertyUntil = function(fn, o) {
    var rc;
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            rc = fn(o[k], k);
            if (rc)
                break;
        }
    }
    return rc;
};

var eachPropertyDeep = function(fn, o) {
    for (var k in o)
        fn(o[k], k);
};

var visit = doc(function(visitor, src, options) {
    var enumerate, visit_obj, process_obj, ctx;
    options = options || {};
    enumerate = ((options.proto || options.deep)
                 ? eachPropertyDeep : eachProperty);
    ctx = options.ctx || null;
    process_obj = function(ctx, src) {
        if (typeof src === "object")
            enumerate(function(v, k) {
                visit_obj(ctx, k, v);
            }, src);
        return ctx;
    };
    visit_obj = function(ctx, key, src) {
        return process_obj(visitor(ctx, key, src), src);
    };
    return visit_obj(ctx, null, src);
}, {params: { visitor: { brief: "Function to be called for each node",
                         params: { ctx: "Context for first level nodes is coming"
                                   + "from options.ctx, context for nested layers"
                                   + " are got as a result of parent node processing"
                                   , key: "Node name", src: "Node data"}},
              src: "Object tree to be visited",
              options: {proto: "Should prototype be traversed too",
                        deep: "Synonym for options.proto",
                        ctx: "Context to be passed to the top level "
                        + "visiting function"}
            },
   result: "options.ctx or null"});

var mapObject = doc(function(fn, o, options) {
    var res = [];
    options = options || {};
    var filter;
    if (options.enum_fn)
        filter = function(v, k) { return (typeof v !== "function"); };
    var enumerate = options.deep ? eachPropertyDeep : eachProperty;
    enumerate(function(v, k) {
        if (!filter || filter(v, k))
            res.push(fn(v, k));
    }, o);
    return res;
}, { params : { o : "Object"
                , fn : "function, producing resulting value from input (key, value)"
                , options : "deep(bool) - should prototypes be traversed,"
                + "enum_fn(bool) - should functions also be traversed"
              }
   });

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

        enumerate(function(v, n) {
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

var functionStack = function() {
    var stack = [];
    var that = {};
    that.push = function(fn) {
        stack.push(fn);
    };
    that.execute = function() {
        stack.reverse();
        each(function(fn) { fn(); }, stack);
    };
    return Object.create(that);
};

var arrayToSet = function(arr) {
    var res = {};
    each(function(v) { res[v] = true; }, arr);
    return res;
};

exports = {
    each: each,
    map: map,
    filter: filter,
    mapObject: mapObject,
    foldl: foldl,
    eachProperty: eachProperty,
    eachPropertyDeep: eachPropertyDeep,
    visit: visit,
    functionStack: functionStack,
    arrayToSet: arrayToSet,
    first: first
};
