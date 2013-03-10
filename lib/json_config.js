/*
 * Configuration access
 *
 * Copyright (C) 2013 Jolla Ltd.
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

require("json/json2.js");
var error = require('error');
var os = require('os');

exports = Object.create({
    read : function(src) {
        return os.path.isfile(src)
             ? JSON.parse(os.read_file(src))
             : undefined;
    },
    write : function(obj, dst) {
        var output = JSON.stringify(obj, null, '\t');
        var written = os.write_file(dst, output);
        if (written !== output.length)
            error.raise({msg: "File is not written", name : dst });
        return written;
    }
});
