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
        var start_time

        var init = function(config) {
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

        var module = function(name, config, options) {
            var root_dir = os.path(git.path(), name)
            var data_dir = os.path(root_dir, "data")
            var blobs_dir = os.path(root_dir, "blobs")
            var blobs_rel = os.path(name, "blobs")
            var mkdir = os.mkdir;

            var exec_script = function(action) {
                var args = ['--action', action,
                            '--dir', data_dir,
                            '--bin-dir', blobs_dir,
                            '--home-dir', options.home ]
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

                git.commit(name + " " + start_time.toGitTag());

                status = git.status(root_dir)
                if (isnt_commited(status))
                    throw lib.error({msg : "Not fully commited",
                                     dir : root_dir,
                                     status : status_dump(status)})

            }
            return { backup : backup, restore : restore }
        }

        var backup = function(config, options) {
            var head, head_before_module, name
            var res = { succeeded :[], failed : [] }

            var rollback = function(name) {
                err.module = name
                debug.error("Failed to backup " + name + ", reason: " + err.toString())
                res.failed.push(name)
                git.reset(['--hard', head_before_module], true)
                git.clean(['-fd'])
            }

            var backup_module = function(name) {
                try {
                    module(name, config[name], options).backup()
                    res.succeeded.push(name)
                    head_before_module = git.rev_parse('master')
                } catch (err) {
                    rollback(name)
                }
            }

            start_time = sys.date()
            head = git.rev_parse('master')
            head_before_module = head

            if (options.module) {
                backup_module(options.module)
            } else {
                for (name in config)
                    backup_module(name)
            }

            git.tag([start_time.toGitTag()])
            git.tag(['-d', 'latest'], true)
            git.tag(['latest'])
            return res
        };

        var restore = function(config, options) {
            var res = { succeeded :[], failed : [] }

            var restore_module = function (name) {
                try {
                    module(name, config[name], options).restore()
                    res.succeeded.push(name);
                } catch (err) {
                    err.module = name
                    debug.error("Failed to restore " + name
                                + ", reason: " + err.toString())
                    res.failed.push(name)
                }
            }

            if (!options.tag)
                throw lib.error({msg : "tag should be provided for restore"})

            try {
                git.checkout(options.tag)
                if (options.module)
                    restore_module(options.module)
                else
                    for (var name in config)
                        restore_module(name)
            } finally {
                git.checkout('master')
            }
        }
        var list_snapshots = function(config, options) {
            git.tag([])
            print(git.stdout())
        }

        return Object.create({
            init : init,
            backup : backup,
            restore : restore,
            list_snapshots : list_snapshots
        })
    }

    var parse_git_config = function(cfg) {
        var res = {"status.showUntrackedFiles" : "all"}
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

    mk_vault.execute = function(opts) {
        var vault = mk_vault(opts.vault)
        var action = opts.action
        var res

        var modules_config = function() {
            var config = opts.config_path
            if (!config)
                throw lib.error({ msg : "Need config", action : action })
            return JSON.parse(os.read_file(config))
        }
        switch (action) {
        case 'init':
            res = vault.init(parse_git_config(opts.git_cfg))
            break;
        case 'backup':
            res = vault.backup(modules_config(), opts)
            break
        case 'restore':
            res = vault.restore(modules_config(), opts)
            break
        case 'list-snapshots':
            res = vault.list_snapshots(modules_config(), opts)
            break
        default:
            throw lib.error({ msg : "Unknown action", action : action})
            break
        }
        return res
    }
    
    lib.vault = mk_vault
}).call(this)
