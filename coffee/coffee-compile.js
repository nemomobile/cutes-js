/*
 * Basic wrapper for CoffeeScript compiler
 *
 * Copyright (C) 2013 Jolla Ltd.
 * Contact: Denis Zalevskiy <denis.zalevskiy@jollamobile.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
(function() {

    var args = cutes.module.args
    if (args.length != 2) {
        print("Usage:", args[0], "<compiled_script.coffee>")
        return 1
    }

    var Q = cutes.extend('qt.core')
    cutes.include('coffee-script.js')
    var cs = this.CoffeeScript
    var read_file = function(file_name) {
        var f = new Q.File(file_name)
        f.open(Q.IODevice.ReadOnly)
        try {
            return f.readAll().toString()
        } finally {
            f.close()
        }
    }
    print(cs.compile(read_file(args[1])))

}).call(this)
