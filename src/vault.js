/*
 * Backup framework
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

(function () {
    qtscript.use("qt.core")
    qtscript.eval("sys.js")
    qtscript.eval("os.js")
    qtscript.eval("subprocess.js")
    qtscript.eval("json2.js")
    qtscript.eval("util.js")
    qtscript.eval("git.js")

    var os = lib.os
    var sys = lib.sys
    var subprocess = lib.subprocess
    var util = lib.util
    var debug = lib.debug

    Date.method('toGitTag', function() {
        return this.toISOString().replace(/:/g, '-')
    })

    var mk_vault = function(path) {

        var git = lib.git(path)
        var storage = new QDir(os.path(path,".git"))
        var message_file = os.path(path, ".message")
        var start_time_tag

        var init = function(config) {
            config["status.showUntrackedFiles"] = "all"

            if (!os.mkdir(path))
                throw lib.error({ msg : "Can't init vault", path : path,
                                  reason : "directory already exists" });

            try {
                if (git.init())
                    throw lib.error({ msg : "Can't init git", path : path,
                                      stderr : git.stderr()})
                if (!storage.exists())
                    throw lib.error({ msg : "Can't find .git", path : path,
                                      stderr : git.stderr()})
                git.config(config);
                var anchor_file = os.path(path, '.vault')
                os.write_file(anchor_file, sys.date().toGitTag())
                git.add(anchor_file)
                git.commit('anchor')
                git.tag(['anchor'])
                git.tag(['latest'])
            } catch (err) {
                os.rmtree(path)
                throw err
            }
        }

        var is_clean = function(status) {
            return lib.util.first(status, function() {
                return !this.is_clean
            }) < status.length
        }

        var status_dump = function(status) {
            return util.map(status, function() {
                return this.toString()
            }).join(', ')
        }

        var mk_module = function(config, home) {
            var name = config.name
            var root_dir = os.path(git.path(), name)
            var data_dir = os.path(root_dir, "data")
            var blobs_dir = os.path(root_dir, "blobs")
            var blobs_rel = os.path(name, "blobs")
            var mkdir = os.mkdir;

            var reset = function(treeish) {
                git.clean(['-fd', '--', root_dir])
                git.checkout(treeish, ['--', root_dir])
            }

            var exec_script = function(action) {
                var args = ['--action', action,
                            '--dir', data_dir,
                            '--bin-dir', blobs_dir,
                            '--home-dir', home ]
                debug.info(subprocess.check_output(config.script, args))
            }

            var delete_blob = function(status) {
                git.rm(status.src)
            }

            var save_blob = function(status) {
                var target, sha, that
                var blob_dir, blob_fname, link_fname
                var git_path = status.src
                if (status.index == ' ' && status.tree == 'D')
                    return delete_blob(status)

                sha = git.hash_object(git_path)
                that = { root : os.path(git.path(), '.git', 'blobs'),
                         prefix : sha.slice(0, 2),
                         id : sha.slice(2) }
                debug.debug("ID ", that.id)
                mkdir(that.root)
                blob_dir = os.path(that.root, that.prefix)
                mkdir(blob_dir)
                blob_fname = os.path(blob_dir, that.id)
                link_fname = os.path(git.path(), git_path)
                if (os.path.isfile(blob_fname)) {
                    debug.debug("unlink")
                    os.unlink(link_fname)
                } else {
                    debug.debug("rename")
                    os.rename(link_fname, blob_fname)
                }
                target = os.path.relative(blob_fname, os.path.dirname(link_fname))
                os.symlink(target, link_fname)
                return that;
            }

            var restore = function() {
                exec_script('import')
            }

            var backup = function() {
                var status, i

                var is_tree_dirty = function(status) {
                    return util.first(status, function() {
                        return !this.is_tree_clean()
                    }) < status.length
                }

                var isnt_commited = function(status) {
                    return util.first(status, function() {
                        return !this.is_clean()
                    }) < status.length
                }

                os.rmtree(data_dir)
                os.rmtree(blobs_dir)

                mkdir(root_dir)
                mkdir(data_dir)
                mkdir(blobs_dir)
                exec_script('export')

                status = git.status(blobs_rel)
                for (i = 0; i < status.length; ++i)
                    save_blob(status[i])

                // commit data
                status = git.status(root_dir)
                if (!status.length) {
                    debug.info("Nothing to backup for " + name)
                    return
                }

                git.add(root_dir, ['-A']);
                status = git.status(root_dir)
                if (is_tree_dirty(status))
                    throw lib.error({msg : "Dirty tree",
                                     dir : root_dir,
                                     status : status_dump(status) })

                git.commit(">" + name);

                status = git.status(root_dir)
                if (isnt_commited(status))
                    throw lib.error({msg : "Not fully commited",
                                     dir : root_dir,
                                     status : status_dump(status)})

            }
            return { backup : backup,
                     restore : restore,
                     reset : reset }
        }

        var backup = function(config, home, options) {
            var head, name
            var res = { succeeded :[], failed : [] }

            var backup_module = function(name) {
                var head_before = git.rev_parse('master')
                config[name].name = name
                var module = mk_module(config[name], home)

                try {
                    module.backup()
                    res.succeeded.push(name)
                } catch (err) {
                    err.module = name
                    debug.error("Failed to backup " + name + ", reason: "
                            + err.toString())
                    res.failed.push(name)
                    module.reset(head_before)
                }
            }

            start_time_tag = sys.date().toGitTag()

            if (options && options.module) {
                backup_module(options.module)
            } else {
                for (name in config) {
                    backup_module(name)
                }
            }

            message = ((options && options.message)
                       ? options.message : start_time_tag)
            os.write_file(message_file, message)
            git.add(".message")
            git.commit([start_time_tag, message].join('\n'))

            git.tag([start_time_tag])
            git.tag(['-d', 'latest'], true)
            git.tag(['latest'])
            return res
        };

        var restore = function(config, home, tag, options) {
            var res = { succeeded :[], failed : [] }
            var name

            var restore_module = function(name) {
                config[name].name = name
                var module = mk_module(config[name], home)
                try {
                    module.restore()
                    res.succeeded.push(name)
                } catch (err) {
                    err.module = name
                    debug.error("Failed to restore " + name
                                + ", reason: " + err.toString())
                    res.failed.push(name)
                }
            }

            if (!tag)
                throw lib.error({msg : "tag should be provided to restore"})

            try {
                git.checkout(tag)
                if (options && options.module)
                    restore_module(options.module)
                else
                    for (name in config)
                        restore_module(name)
            } finally {
                git.checkout('master')
            }
        }
        var list_snapshots = function() {
            git.tag([])
            return git.stdout().split('\n')
        }

        return Object.create({
            init : init,
            backup : backup,
            restore : restore,
            list_snapshots : list_snapshots,
        })
    }

    var parse_kv_pairs = function(cfg) {
        var res = {}
        var pairs, i, kv
        if (cfg) {
            util.foreach(cfg.split(','), function(v) {
                kv = v.split('=')
                if (kv.length == 2 && kv[0].length)
                    res[kv[0]] = kv[1]
            })
        }
        return res
    }

    mk_vault.execute = function(options) {
        var vault = mk_vault(options.vault)
        var action = options.action
        var res

        var config = function() {
            var src = options.config_path
            if (!src)
                throw lib.error({ msg : "Need config", action : action })
            return JSON.parse(os.read_file(src))
        }

        switch (action) {
        case 'init':
            res = vault.init(parse_kv_pairs(options.git_config))
            break;
        case 'backup':
            res = vault.backup(config(), options.home,
                               {module : options.module})
            break
        case 'restore':
            res = vault.restore(config(), options.home, options.tag,
                                {module : options.module})
            break
        case 'list-snapshots':
            res = vault.list_snapshots()
            print(res.join('\n'))
            break
        default:
            throw lib.error({ msg : "Unknown action", action : action})
            break
        }
        return res
    }

    lib.vault = mk_vault
}).call(this)
