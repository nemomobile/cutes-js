/*
 * Backup command-line tool
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

(function() {
    qtscript.load("sys.js")
    qtscript.load("vault.js")
    var cmdline = lib.sys.getopt({
        vault : { short_ : "V", long_ : "vault"
                  , has_param : true, required : true },
        action : { short_ : "a", long_ : "action"
                   , has_param : true, required : true },

        home : { short_ : "H", long_ : "home", has_param : true },
        git_config : { short_ : "g", long_ : "git-config", has_param : true },
        config_path : { short_ : "c", long_ : "config-path", has_param : true },
        message : { short_ : "m", long_ : "message", has_param : true},
        tag : { short_ : "t", long_ : "tag", has_param : true },
        module : { short_ : "M", long_ : "module", has_param : true },
        data : { short_ : "d", long_ : "data", has_param : true }
    }).parse(qtscript.script.args)
    return lib.vault.execute(cmdline.opts)
}).call(this)
