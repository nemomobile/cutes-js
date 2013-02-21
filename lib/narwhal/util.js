
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- isaacs Isaac Schlueter
// -- nrstott Nathan Stott
// -- fitzgen Nick Fitzgerald
// -- nevilleburnell Neville Burnell
// -- cadorn Christoph Dorn

// a decorator for functions that curry "polymorphically",
// that is, that return a function that can be tested
// against various objects if they're only "partially
// completed", or fewer arguments than needed are used.
// 
// this enables the idioms:
//      [1, 2, 3].every(lt(4)) eq true
//      [1, 2, 3].map(add(1)) eq [2, 3, 4]
//      [{}, {}, {}].forEach(set('a', 10))
//

var that = {}


that.operator = function (name, length, block) {
    var operator = function () {
        var args = that.array(arguments);
        var completion = function (object) {
            if (
                typeof object == "object" &&
                object !== null && // seriously?  typeof null == "object"
                name in object && // would throw if object === null
                // not interested in literal objects:
                !Object.prototype.hasOwnProperty.call(object, name)
            )
                return object[name].apply(object, args);
            return block.apply(
                this,
                [object].concat(args)
            );
        };
        if (arguments.length < length) {
            // polymoprhic curry, delayed completion
            return completion;
        } else {
            // immediate completion
            return completion.call(this, args.shift());
        }
    };
    operator.name = name;
    operator.displayName = name;
    operator.length = length;
    operator.operator = block;
    return operator;
};

that.no = function (value) {
    return value === null || value === undefined;
};

// object

that.object = that.operator('toObject', 1, function (object) {
    var items = object;
    if (!items.length)
        items = that.items(object);
    var copy = {};
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var key = item[0];
        var value = item[1];
        copy[key] = value;
    }
    return copy;
});

that.object.copy = function (object) {
    var copy = {};
    that.object.keys(object).forEach(function (key) {
        copy[key] = object[key];
    });
    return copy;
};

that.object.deepCopy = function (object) {
    var copy = {};
    that.object.keys(object).forEach(function (key) {
        copy[key] = that.deepCopy(object[key]);
    });
    return copy;
};

that.object.eq = function (a, b, stack) {
    return (
        !that.no(a) && !that.no(b) &&
        that.array.eq(
            that.sort(that.object.keys(a)),
            that.sort(that.object.keys(b))
        ) &&
        that.object.keys(a).every(function (key) {
            return that.eq(a[key], b[key], stack);
        })
    );
};

that.object.len = function (object) {
    return that.object.keys(object).length;
};

that.object.has = function (object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
};

that.object.keys = function (object) {
    var keys = [];
    for (var key in object) {
        if (that.object.has(object, key))
            keys.push(key);
    }
    return keys;
};

that.object.values = function (object) {
    var values = [];
    that.object.keys(object).forEach(function (key) {
        values.push(object[key]);
    });
    return values;
};

that.object.items = function (object) {
    var items = [];
    that.object.keys(object).forEach(function (key) {
        items.push([key, object[key]]);
    });
    return items;
};

/**
 * Updates an object with the properties from another object.
 * This function is variadic requiring a minimum of two arguments.
 * The first argument is the object to update.  Remaining arguments
 * are considered the sources for the update.  If multiple sources
 * contain values for the same property, the last one with that
 * property in the arguments list wins.
 *
 * example usage:
 * util.update({}, { hello: "world" });  // -> { hello: "world" }
 * util.update({}, { hello: "world" }, { hello: "le monde" }); // -> { hello: "le monde" }
 *
 * @returns Updated object
 * @type Object
 *
 */
that.object.update = function () {
    return variadicHelper(arguments, function(target, source) {
        var key;
        for (key in source) {
            if (that.object.has(source, key)) {
                target[key] = source[key];
            }
        }
    });
};

that.object.deepUpdate = function (target, source) {
    var key;
	for (key in source) {
        if(that.object.has(source, key)) {
            if(typeof source[key] == "object" && that.object.has(target, key)) {
                that.object.deepUpdate(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
};

/**
 * Updates an object with the properties of another object(s) if those
 * properties are not already defined for the target object. First argument is
 * the object to complete, the remaining arguments are considered sources to
 * complete from. If multiple sources contain the same property, the value of
 * the first source with that property will be the one inserted in to the
 * target.
 *
 * example usage:
 * util.complete({}, { hello: "world" });  // -> { hello: "world" }
 * util.complete({ hello: "narwhal" }, { hello: "world" }); // -> { hello: "narwhal" }
 * util.complete({}, { hello: "world" }, { hello: "le monde" }); // -> { hello: "world" }
 *
 * @returns Completed object
 * @type Object
 *
 */
that.object.complete = function () {
    return variadicHelper(arguments, function(target, source) {
        var key;
        for (key in source) {
            if (
                that.object.has(source, key) &&
                !that.object.has(target, key)
            ) {
                target[key] = source[key];
            }
        }
    });
};

that.object.deepComplete = function () {
    return variadicHelper(arguments, function (target, source) {
        var key;
        for (key in source) {
            if (
                that.object.has(source, key) &&
                !that.object.has(target, key)
            ) {
                target[key] = that.deepCopy(source[key]);
            }
        }
    });
};

that.object.repr = function (object) {
    return "{" +
        that.object.keys(object)
        .map(function (key) {
            return that.enquote(key) + ": " +
                that.repr(object[key]);
        }).join(", ") +
    "}";
};

/**
 * @param args Arguments list of the calling function
 * First argument should be a callback that takes target and source parameters.
 * Second argument should be target.
 * Remaining arguments are treated a sources.
 *
 * @returns Target
 * @type Object
 */
var variadicHelper = function (args, callback) {
    var sources = Array.prototype.slice.call(args);
    var target = sources.shift();

    sources.forEach(function(source) {
        callback(target, source);
    });

    return target;
};

// array

that.array = function (array) {
    if (that.no(array))
        return [];
    if (!that.isArrayLike(array)) {
        if (
            array.toArray &&
            !Object.prototype.hasOwnProperty.call(array, 'toArray')
        ) {
            return array.toArray();
        } else if (
            array.forEach &&
            !Object.prototype.hasOwnProperty.call(array, 'forEach')
        ) {
            var results = [];
            array.forEach(function (value) {
                results.push(value);
            });
            return results;
        } else if (typeof array === "string") {
            return Array.prototype.slice.call(array);
        } else {
            return that.items(array);
        }
    }
    return Array.prototype.slice.call(array);
};

that.array.coerce = function (array) {
    if (!Array.isArray(array))
        return that.array(array);
    return array;
};

that.isArrayLike = function(object) {
    return Array.isArray(object) || that.isArguments(object);
};

// from http://code.google.com/p/google-caja/wiki/NiceNeighbor
// by "kangax"
//
// Mark Miller posted a solution that will work in ES5 compliant
// implementations, that may provide future insight:
// (http://groups.google.com/group/narwhaljs/msg/116097568bae41c6)
that.isArguments = function (object) {
    // ES5 reliable positive
    if (Object.prototype.toString.call(object) == "[object Arguments]")
        return true;
    // for ES5, we will still need a way to distinguish false negatives
    //  from the following code (in ES5, it is possible to create
    //  an object that satisfies all of these constraints but is
    //  not an Arguments object).
    // callee should exist
    if (
        !typeof object == "object" ||
        !Object.prototype.hasOwnProperty.call(object, 'callee') ||
        !object.callee || 
        // It should be a Function object ([[Class]] === 'Function')
        Object.prototype.toString.call(object.callee) !== '[object Function]' ||
        typeof object.length != 'number'
    )
        return false;
    for (var name in object) {
        // both "callee" and "length" should be { DontEnum }
        if (name === 'callee' || name === 'length') return false;
    }
    return true;
};

that.array.copy = that.array;

that.array.deepCopy = function (array) {
    return array.map(that.deepCopy);
};

that.array.len = function (array) {
    return array.length;
};

that.array.has = function (array, value) {
    return Array.prototype.indexOf.call(array, value) >= 0;
};

that.array.put = function (array, key, value) {
    array.splice(key, 0, value);
    return array;
};

that.array.del = function (array, begin, end) {
    array.splice(begin, end === undefined ? 1 : (end - begin));
    return array;
};

that.array.eq = function (a, b, stack) {
    return that.isArrayLike(b) &&
        a.length == b.length &&
        that.zip(a, b).every(that.apply(function (a, b) {
            return that.eq(a, b, stack);
        }));
};

that.array.lt = function (a, b) {
    var length = Math.max(a.length, b.length);
    for (var i = 0; i < length; i++)
        if (!that.eq(a[i], b[i]))
            return that.lt(a[i], b[i]);
    return false;
};

that.array.repr = function (array) {
    return "[" + that.map(array, that.repr).join(', ') + "]";
};

that.array.first = function (array) {
    return array[0];
};

that.array.last = function (array) {
    return array[array.length - 1];
};

that.apply = that.operator('apply', 2, function (args, block) {
    return block.apply(this, args);
});

that.copy = that.operator('copy', 1, function (object) {
    if (that.no(object))
        return object;
    if (that.isArrayLike(object))
        return that.array.copy(object);
    if (object instanceof Date)
        return object;
    if (typeof object == 'object')
        return that.object.copy(object);
    return object;
});

that.deepCopy = that.operator('deepCopy', 1, function (object) {
    if (that.no(object))
        return object;
    if (that.isArrayLike(object))
        return that.array.deepCopy(object);
    if (typeof object == 'object')
        return that.object.deepCopy(object);
    return object;
});

that.repr = that.operator('repr', 1, function (object) {
    if (that.no(object))
        return String(object);
    if (that.isArrayLike(object))
        return that.array.repr(object);
    if (typeof object == 'object')
        return that.object.repr(object);
    if (typeof object == 'string')
        return that.enquote(object);
    return object.toString();
});

that.keys = that.operator('keys', 1, function (object) {
    if (that.isArrayLike(object))
        return that.range(object.length);
    else if (typeof object == 'object')
        return that.object.keys(object);
    return [];
});

that.values = that.operator('values', 1, function (object) {
    if (that.isArrayLike(object))
        return that.array(object);
    else if (typeof object == 'object')
        return that.object.values(object);
    return [];
});

that.items = that.operator('items', 1, function (object) {
    if (that.isArrayLike(object) || typeof object == "string")
        return that.enumerate(object);
    else if (typeof object == 'object')
        return that.object.items(object);
    return [];
});

that.len = that.operator('len', 1, function (object) {
    if (that.isArrayLike(object))
        return that.array.len(object);
    else if (typeof object == 'object')
        return that.object.len(object);
});

that.has = that.operator('has', 2, function (object, value) {
    if (that.isArrayLike(object))
        return that.array.has(object, value);
    else if (typeof object == 'object')
        return that.object.has(object, value);
    return false;
});

that.get = that.operator('get', 2, function (object, key, value) {
    if (typeof object == "string") {
        if (!typeof key == "number")
            throw new Error("TypeError: String keys must be numbers");
        if (!that.has(that.range(object.length), key)) {
            if (arguments.length == 3)
                return value;
            throw new Error("KeyError: " + that.repr(key));
        }
        return object.charAt(key);
    }
    if (typeof object == "object") {
        if (!that.object.has(object, key)) {
            if (arguments.length == 3)
                return value;
            throw new Error("KeyError: " + that.repr(key));
        }
        return object[key];
    } 
    throw new Error("Object does not have keys: " + that.repr(object));
});

that.set = that.operator('set', 3, function (object, key, value) {
    object[key] = value;
    return object;
});

that.getset = that.operator('getset', 3, function (object, key, value) {
    if (!that.has(object, key))
        that.set(object, key, value);
    return that.get(object, key);
});

that.del = that.operator('del', 2, function (object, begin, end) {
    if (that.isArrayLike(object))
        return that.array.del(object, begin, end);
    delete object[begin];
    return object;
});

that.cut = that.operator('cut', 2, function (object, key) {
    var result = that.get(object, key);
    that.del(object, key);
    return result;
});

that.put = that.operator('put', 2, function (object, key, value) {
    if (that.isArrayLike(object))
        return that.array.put(object, key, value);
    return that.set(object, key, value);
});

that.first = that.operator('first', 1, function (object) {
    return object[0];
});

that.last = that.operator('last', 1, function (object) {
    return object[object.length - 1];
});

that.update = that.operator('update', 2, function () {
    var args = Array.prototype.slice.call(arguments);
    return that.object.update.apply(this, args);
});

that.deepUpdate = that.operator('deepUpdate', 2, function (target, source) {
    that.object.deepUpdate(target, source);
});

that.complete = that.operator('complete', 2, function (target, source) {
    var args = Array.prototype.slice.call(arguments);
    return that.object.complete.apply(this, args);
});

that.deepComplete = that.operator('deepComplete', 2, function (target, source) {
    var args = Array.prototype.slice.call(arguments);
    return that.object.deepComplete.apply(this, args);
});

that.remove = that.operator('remove', 2, function (list, value) {
    var index;
    if ((index = list.indexOf(value))>-1)
        list.splice(index,1);
    return list;
});

// TODO insert
// TODO discard

that.range = function () {
    var start = 0, stop = 0, step = 1;
    if (arguments.length == 1) {
        stop = arguments[0];
    } else {
        start = arguments[0];
        stop = arguments[1];
        step = arguments[2] || 1;
    }
    var range = [];
    for (var i = start; i < stop; i += step)
        range.push(i);
    return range;
};

that.forEach = function (array, block) {
    Array.prototype.forEach.call(
        that.array.coerce(array),
        block
    );
};

that.forEachApply = function (array, block) {
    Array.prototype.forEach.call(
        that.array.coerce(array),
        that.apply(block)
    );
};

that.map = function (array, block, context) {
    return Array.prototype.map.call(
        that.array.coerce(array),
        block,
        context
    );
};

that.mapApply = function (array, block) {
    return Array.prototype.map.call(
        that.array.coerce(array),
        that.apply(block)
    );
};

that.every = that.operator('every', 2, function (array, block, context) {
    return that.all(that.map(array, block, context));
});

that.some = that.operator('some', 2, function (array, block, context) {
    return that.any(that.map(array, block, context));
});

that.all = that.operator('all', 1, function (array) {
    array = that.array.coerce(array);
    for (var i = 0; i < array.length; i++)
        if (!array[i])
            return false;
    return true;
});

that.any = that.operator('all', 1, function (array) {
    array = that.array.coerce(array);
    for (var i = 0; i < array.length; i++)
        if (array[i])
            return true;
    return false;
});

that.reduce = that.operator('reduce', 2, function (array, block, basis) {
    array = that.array.coerce(array);
    return array.reduce.apply(array, arguments);
});

that.reduceRight = that.operator('reduceRight', 2, function (array, block, basis) {
    array = that.array.coerce(array);
    return array.reduceRight.apply(array, arguments);
});

that.zip = function () {
    return that.transpose(arguments);
};

that.transpose = function (array) {
    array = that.array.coerce(array);
    var transpose = [];
    var length = Math.min.apply(this, that.map(array, function (row) {
        return row.length;
    }));
    for (var i = 0; i < array.length; i++) {
        var row = array[i];
        for (var j = 0; j < length; j++) {
            var cell = row[j];
            if (!transpose[j])
                transpose[j] = [];
            transpose[j][i] = cell;
        }
    }
    return transpose;
};

that.enumerate = function (array, start) {
    array = that.array.coerce(array);
    if (that.no(start))
        start = 0;
    return that.zip(
        that.range(start, start + array.length),
        array
    );
};

// arithmetic, transitive, and logical operators

that.is = function (a, b) {
    // <Mark Miller>
    if (a === b)
        // 0 === -0, but they are not identical
        return a !== 0 || 1/a === 1/b;
    // NaN !== NaN, but they are identical.
    // NaNs are the only non-reflexive value, i.e., if a !== a,
    // then a is a NaN.
    return a !== a && b !== b;
    // </Mark Miller>
};

that.eq = that.operator('eq', 2, function (a, b, stack) {
    if (!stack)
        stack = [];
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (that.no(a))
        return that.no(b);
    if (a instanceof Date)
        return a.valueOf() === b.valueOf();
    if (a instanceof RegExp)
        return a.source === b.source &&
            a.global === b.global &&
            a.ignoreCase === b.ignoreCase &&
            a.multiline === b.multiline;
    if (typeof a === "function") { 
        var caller = stack[stack.length - 1];
        // XXX what is this for?  can it be axed?
        // it comes from the "equiv" project code
        return caller !== Object &&
            typeof caller !== "undefined";
    }
    if (that.isArrayLike(a))
        return that.array.eq(
            a, b,
            stack.concat([a.constructor])
        );
    if (typeof a === 'object')
        return that.object.eq(
            a, b,
            stack.concat([a.constructor])
        );
    return false;
});

that.ne = that.operator('ne', 2, function (a, b) {
    return !that.eq(a, b);
});

that.lt = that.operator('lt', 2, function (a, b) {
    if (that.no(a) != that.no(b))
        return that.no(a) > that.no(b);
    if (that.isArrayLike(a) && that.isArrayLike(b))
        return that.array.lt(a, b);
    return a < b;
});

that.gt = that.operator('gt', 2, function (a, b) {
    return !(that.lt(a, b) || that.eq(a, b));
});

that.le = that.operator(2, 'le', function (a, b) {
    return that.lt(a, b) || that.eq(a, b);
});

that.ge = that.operator(2, 'ge', function (a, b) {
    return !that.lt(a, b);
});

that.mul = that.operator(2, 'mul', function (a, b) {
    if (typeof a == "string")
        return that.string.mul(a, b);
    return a * b;
});

/*** by
    returns a `comparator` that compares
    values based on the values resultant from
    a given `relation`.
    accepts a `relation` and an optional comparator.

    To sort a list of objects based on their
    "a" key::

        objects.sort(by(get("a")))

    To get those in descending order::

        objects.sort(by(get("a")), desc)

    `by` returns a comparison function that also tracks
    the arguments you used to construct it.  This permits
    `sort` and `sorted` to perform a Schwartzian transform
    which can increase the performance of the sort
    by a factor of 2.
*/
that.by = function (relation) {
    var compare = arguments[1];
    if (that.no(compare))
        compare = that.compare;
    var comparator = function (a, b) {
        a = relation(a);
        b = relation(b);
        return compare(a, b);
    };
    comparator.by = relation;
    comparator.compare = compare;
    return comparator;
};

that.compare = that.operator(2, 'compare', function (a, b) {
    if (that.no(a) !== that.no(b))
        return that.no(b) - that.no(a);
    if (typeof a === "number" && typeof b === "number")
        return a - b;
    return that.eq(a, b) ? 0 : that.lt(a, b) ? -1 : 1;
});

/*** sort
    an in-place array sorter that uses a deep comparison
    function by default (compare), and improves performance if
    you provide a comparator returned by "by", using a
    Schwartzian transform.
*/
that.sort = function (array, compare) {
    if (that.no(compare))
        compare = that.compare;
    if (compare.by) {
        /* schwartzian transform */
        array.splice.apply(
            array,
            [0, array.length].concat(
                array.map(function (value) {
                    return [compare.by(value), value];
                }).sort(function (a, b) {
                    return compare.compare(a[0], b[0]);
                }).map(function (pair) {
                    return pair[1];
                })
            )
        );
    } else {
        array.sort(compare);
    }
    return array;
};

/*** sorted
    returns a sorted copy of an array using a deep
    comparison function by default (compare), and
    improves performance if you provide a comparator
    returned by "by", using a Schwartzian transform.
*/
that.sorted = function (array, compare) {
    return that.sort(that.array.copy(array), compare);
};

that.reverse = function (array) {
    return Array.prototype.reverse.call(array);
};

that.reversed = function (array) {
    return that.reverse(that.array.copy(array));
};

that.hash = that.operator(1, 'hash', function (object) {
    return '' + object;
});

that.unique = that.operator(1, 'unique', function (array, eq, hash) {
    var visited = {};
    if (!eq) eq = that.eq;
    if (!hash) hash = that.hash;
    return array.filter(function (value) {
        var bucket = that.getset(visited, hash(value), []);
        var finds = bucket.filter(function (other) {
            return eq(value, other);
        });
        if (!finds.length)
            bucket.push(value);
        return !finds.length;
    });
});

// string

that.string = that.operator(1, 'toString', function (object) {
    return '' + object;
});

that.string.mul = function (string, n) {
    return that.range(n).map(function () {
        return string;
    }).join('');
};

/*** escape
    escapes all characters of a string that are
    special to JavaScript and many other languages.
    Recognizes all of the relevant
    control characters and formats all other
    non-printable characters as Hex byte escape
    sequences or Unicode escape sequences depending
    on their size.

    Pass ``true`` as an optional second argument and
    ``escape`` produces valid contents for escaped
    JSON strings, wherein non-printable-characters are
    all escaped with the Unicode ``\u`` notation.
*/
/* more Steve Levithan flagrence */
var escapeExpression = /[^ !#-[\]-~]/g;
/* from Doug Crockford's JSON library */
var escapePatterns = {
    '\b': '\\b',    '\t': '\\t',
    '\n': '\\n',    '\f': '\\f',    '\r': '\\r',
    '"' : '\\"',    '\\': '\\\\'
};
that.escape = function (value, strictJson) {
    if (typeof value != "string")
        throw new Error(
            module.path +
            "#escape: requires a string.  got " +
            that.repr(value)
        );
    return value.replace(
        escapeExpression, 
        function (match) {
            if (escapePatterns[match])
                return escapePatterns[match];
            match = match.charCodeAt();
            if (!strictJson && match < 256)
                return "\\x" + that.padBegin(match.toString(16), 2);
            return '\\u' + that.padBegin(match.toString(16), 4);
        }
    );
};

/*** enquote
    transforms a string into a string literal, escaping
    all characters of a string that are special to
    JavaScript and and some other languages.

    ``enquote`` uses double quotes to be JSON compatible.

    Pass ``true`` as an optional second argument to
    be strictly JSON compliant, wherein all
    non-printable-characters are represented with
    Unicode escape sequences.
*/
that.enquote = function (value, strictJson) {
    return '"' + that.escape(value, strictJson) + '"';
};

/*** expand
    transforms tabs to an equivalent number of spaces.
*/
// TODO special case for \r if it ever matters
that.expand = function (str, tabLength) {
    str = String(str);
    tabLength = tabLength || 4;
    var output = [],
        tabLf = /[\t\n]/g,
        lastLastIndex = 0,
        lastLfIndex = 0,
        charsAddedThisLine = 0,
        tabOffset, match;
    while (match = tabLf.exec(str)) {
        if (match[0] == "\t") {
            tabOffset = (
                tabLength - 1 -
                (
                    (match.index - lastLfIndex) +
                    charsAddedThisLine
                ) % tabLength
            );
            charsAddedThisLine += tabOffset;
            output.push(
                str.slice(lastLastIndex, match.index) +
                that.mul(" ", tabOffset + 1)
            );
        } else if (match[0] === "\n") {
            output.push(str.slice(lastLastIndex, tabLf.lastIndex));
            lastLfIndex = tabLf.lastIndex;
            charsAddedThisLine = 0;
        }
        lastLastIndex = tabLf.lastIndex;
    }
    return output.join("") + str.slice(lastLastIndex);
};

var trimBeginExpression = /^\s\s*/g;
that.trimBegin = function (value) {
    return String(value).replace(trimBeginExpression, "");  
};

var trimEndExpression = /\s\s*$/g;
that.trimEnd = function (value) {
    return String(value).replace(trimEndExpression, "");    
};

that.trim = function (value) {
    return String(value).replace(trimBeginExpression, "").replace(trimEndExpression, "");
};

/* generates padBegin and padEnd */
var augmentor = function (augment) {
    return function (value, length, pad) {
        if (that.no(pad)) pad = '0';
        if (that.no(length)) length = 2;
        value = String(value);
        while (value.length < length) {
            value = augment(value, pad);
        }
        return value;
    };
};

/*** padBegin

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the begining
    side of the `String`.

*/
that.padBegin = augmentor(function (value, pad) {
    return pad + value;
});

/*** padEnd

    accepts:
     - a `String` or `Number` value
     - a minimum length of the resultant `String`:
       by default, 2
     - a pad string: by default, ``'0'``.

    returns a `String` of the value padded up to at least
    the minimum length.  adds the padding to the end
    side of the `String`.

*/
that.padEnd = augmentor(function (value, pad) {
    return value + pad;
});

/*** splitName
    splits a string into an array of words from an original
    string.
*/
// thanks go to Steve Levithan for this regular expression
// that, in addition to splitting any normal-form identifier
// in any case convention, splits XMLHttpRequest into
// "XML", "Http", and "Request"
var splitNameExpression = /[a-z]+|[A-Z](?:[a-z]+|[A-Z]*(?![a-z]))|[.\d]+/g;
that.splitName = function (value) {
    return String(value).match(splitNameExpression);
};

/*** joinName
    joins a list of words with a given delimiter
    between alphanumeric words.
*/
that.joinName = function (delimiter, parts) {
    if (that.no(delimiter)) delimiter = '_';
    parts.unshift([]);
    return parts.reduce(function (parts, part) {
        if (
            part.match(/\d/) &&
            that.len(parts) && parts[parts.length-1].match(/\d/)
        ) {
            return parts.concat([delimiter + part]);
        } else {
            return parts.concat([part]);
        }
    }).join('');
};

/*** upper
    converts a name to ``UPPER CASE`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `camel`
     - `title`

*/
that.upper = function (value, delimiter) {
    if (that.no(delimiter))
        return value.toUpperCase();
    return that.splitName(value).map(function (part) {
        return part.toUpperCase();
    }).join(delimiter);
};

/*** lower
    converts a name to a ``lower case`` using
    a given delimiter between numeric words.

    see:
     - `upper`
     - `camel`
     - `title`

*/
that.lower = function (value, delimiter) {
    if (that.no(delimiter))
        return String(value).toLowerCase();
    return that.splitName(value).map(function (part) {
        return part.toLowerCase();
    }).join(delimiter);
};

/*** camel
    converts a name to ``camel Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `title`

*/
that.camel = function (value, delimiter) {
    return that.joinName(
        delimiter,
        that.mapApply(
            that.enumerate(that.splitName(value)),
            function (n, part) {
                if (n) {
                    return (
                        part.substring(0, 1).toUpperCase() +
                        part.substring(1).toLowerCase()
                    );
                } else {
                    return part.toLowerCase();
                }
            }
        )
    );
};

/*** title
    converts a name to ``Title Case`` using
    a given delimiter between numeric words.

    see:
     - `lower`
     - `upper`
     - `camel`

*/
that.title = function (value, delimiter) {
    return that.joinName(
        delimiter,
        that.splitName(value).map(function (part) {
            return (
                part.substring(0, 1).toUpperCase() +
                part.substring(1).toLowerCase()
            );
        })
    );
};

exports = that;
