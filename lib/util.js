/*
 * Misc helper functions
 *
 * Copyright (C) 2012, 2013 Jolla Ltd.
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
    var i
    for (i = (start || 0); i < arr.length; ++i)
        if (fn(arr[i]))
            break
    return i
}

var find_all = function(arr, fn) {
    var i, found = []
    for (i = first(arr, fn, 0); i < arr.length; i = first(arr, fn, i))
        found.push(i)
    return found
}

var map = function(arr, fn) {
    var i
    var res = []
    for (i = 0; i < arr.length; ++i)
        res.push(fn(arr[i]))
    return res
}

var filter = function(arr, fn) {
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

var cons = function(head, tail) {
    var len = arguments.length;
    if (len === 0)
        return [];
    else if (len === 1)
        return [arguments[0]];
    else
        return [arguments[0]].concat(tail);
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

if (!('until' in Object.prototype)) {
    Object.prototype.until = function(fn) {
        var rc;
        for (var k in this) {
            if (this.hasOwnProperty(k)) {
                rc = fn(k, this[k]);
                if (rc)
                    break;
            }
        }
        return rc;
    };
}

Array.prototype.each = function(fn) {
    return map(this, fn);
};

String.method('trim', function() {
    return this.replace(/^\s+|\s+$/g, '')
})

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
    var i = 0, len = arr.length;
    var that = {
        end : function() { return i >= len; },
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

exports = Object.create({
    is_any: any,
    is_all: all,
    forEach : forEach,
    map : map,
    filter : filter,
    first : first,
    all : find_all,
    cons : cons,
    stream : stream
});
