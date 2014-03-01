/*
 * Misc helper functions
 *
 * Copyright (C) 2012-2014 Jolla Ltd.
 * Contact: Denis Zalevskiy <denis.zalevskiy@jollamobile.com>
 *
 * Some code was taken from “JavaScript: The Good Parts by Dou- glas
 * Crockford. Copyright 2008 Yahoo! Inc., 978-0-596-51774-8.”

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
var dump, cons, filter, _fn, doc;

_fn = require('functional');
doc = require('doc');

Function.prototype.method = function(name, func) {
    this.prototype[name] = func
    return this
};

var forEach = function(arr, fn) {
    var i;
    for (i = 0; i < arr.length; ++i)
        fn(arr[i]);
}

var chain = function(arr, fn) {
    var i;
    for (i = 0; i < arr.length; ++i)
        fn = fn(arr[i]);
};

var first = function(arr, fn, start) {
    var i, len = arr.length;
    for (i = (start || 0); i < len; ++i)
        if (fn(arr[i]))
            break;
    return i;
};

var find_all = function(arr, fn) {
    var i, len = arr.length, found = [];
    for (i = first(arr, fn, 0); i < len; i = first(arr, fn, i))
        found.push(i);
    return found;
};

var map = function(arr, fn) {
    var i
    var res = []
    for (i = 0; i < arr.length; ++i)
        res.push(fn(arr[i]))
    return res
}

var extract = function(arr, fn) {
    var i, res = [], item;
    for (i = 0; i < arr.length; ++i) {
        item = fn(arr[i]);
        if (item !== undefined)
            res.push(item);
    }
    return res;
};

var zip = function() {
    if (!arguments.length)
        return [];

    var res = [];
    var len = arguments[0].length;
    for (var i = 0; i < len; ++i)
        res.push([]);
    forEach(arguments, function(arr) {
        var i;
        for (i = 0; i < len; ++i)
            res[i].push(arr[i]);
    });
    return res;
};

var objFromPairs = function(pairs, key_idx, val_idx) {
    var res = {};
    key_idx = key_idx !== undefined ? key_idx : 0;
    val_idx = val_idx !== undefined ? val_idx : 1;
    forEach(pairs, function(nv) {
        res[nv[key_idx]] = nv[val_idx];
    });
    return res;
};

var mapByField = function(arr, field_id) {
    var res = {};
    forEach(arr, function(el) {
        var key = el[field_id];
        res[key] = el;
    });
    return res;
};

filter = function(arr, fn) {
    var i, item, res, len
    len = arr.length
    res = []
    for (i = 0; i < len; ++i) {
        item = arr[i]
        if (fn(item))
            res.push(item)
    }
    return res
}

Function.method('curry', function() {
    var head, _this = this
    head = 1 <= arguments.length ? __slice.call(arguments, 0) : []
    return function() {
        var tail
        tail = 1 <= arguments.length ? __slice.call(arguments, 0) : []
        return _this.apply(null, head.concat(tail))
    }
})

cons = function(head, tail) {
    var len = arguments.length;
    if (len === 0)
        return [];
    else if (len === 1)
        return [head];
    else
        return [head].concat(tail);
};

Number.method('integer', function() {
    return Math[this < 0 ? 'ceil' : 'floor'](this)
})

if (!('each' in Object.prototype)) {
    Object.prototype.each = function(fn) {
        for (var k in this)
            if (this.hasOwnProperty(k))
                fn(k, this[k]);
    };
}

var eachProperty = function(o, fn) {
    for (var k in o)
        if (o.hasOwnProperty(k))
            fn(k, o[k]);
};

var eachPropertyUntil = function(o, fn) {
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

if (!('until' in Object.prototype)) {
    Object.prototype.until = function(fn) {
        return eachPropertyUntil(this, fn);
    };
}

var eachPropertyDeep = function(o, fn) {
    for (var k in o)
        fn(k, o[k]);
};

var mapObject = function(o, fn, options) {
    return _fn.mapObject(function(v, k) { return fn(k, v); }, o, options);
};

Array.prototype.each = function(fn) {
    return forEach(this, fn);
};

String.method('trim', function() {
    return this.replace(/^\s+|\s+$/g, '')
})

String.method('isDecimal', function() {
    return this.match(/^[-+]?[0-9]+$/);
});

var any = function(items) {
    var item, _i, _len
    for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i]
        if (item)
            return true
    }
    return false
}

var all = function(items) {
    var item, _i, _len;
    for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i]
        if (!item) {
            return false
        }
    }
    return true
}

var stream = function(arr) {
    var i = 0;
    var that = {
        end : function() { return i >= arr.length; },
        next : function() { return arr[i++]; },
        map : function(fn) {
            var res = [];
            for (;!that.end();)
                res.push(fn(that));
            return res;
        }
    };
    return that;
};

dump = function(prefix, o, options) {
    var enumerate, dump_object,
    dump_fn, dump_not_obj, dump_default, get_name;

    options = options || { type: true };

    enumerate = ((options.proto || options.deep)
                 ? eachPropertyDeep : eachProperty);

    get_name = function(n, o) {
        return ( options.type
                 ? [n, String(typeof o)].join(':')
                 : n);
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
            ? dump_object(indent, n, v)
            : dump_object(indent, n, v) + " () {...}";
    };

    var was = {};
    dump_object = function(indent, prefix, o) {
        var name = get_name(prefix, o);
        var lines = [[indent, name, '{'].join('')];
        var prev_indent = indent;
        indent += '  ';

        enumerate(o, function(n, v) {
            if (v in was) {
                lines.push(n);
                return;
            }
            was[v] = n;
            if (typeof v !== 'object') {
                lines.push(dump_not_obj(indent, n, v));
            } else {
                if (v !== Object.prototype) {
                    lines.push(dump_object(indent, n, v));
                }
            }
        });
        lines.push(prev_indent + '}');
        return lines.join('\n');
    };
    if (typeof o === 'object')
        return dump_object('', prefix, o);
    else
        return dump_not_obj('', prefix, o);
};

var help = function(fn) {
    return dump("", fn.__doc__ ? fn.__doc__ : "...", { type: false });
};

exports = Object.create({
    is_any: any,
    is_all: all,
    forEach : forEach,
    eachProperty : eachProperty,
    eachPropertyDeep : eachProperty,
    eachPropertyUntil : eachPropertyUntil,
    mapObject: mapObject,
    map : map,
    extract: extract,
    filter : filter,
    first : first,
    all : find_all,
    cons : cons,
    stream : stream,
    dump : dump,
    zip : zip,
    objFromPairs: objFromPairs,
    mapByField: mapByField,
    wrap : doc.wrap,
    doc : doc.doc,
    help : help
});
