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
    qtscript.load("qtcore.js")
    qtscript.load("sys.js")
    qtscript.load("os.js")
    qtscript.load("subprocess.js")
    qtscript.load("json2.js")
    qtscript.load("util.js")
    qtscript.load("git.js")

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
        var modules_config

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
             } catch (err) {
                os.rmtree(path)
                throw err
            }
        }

        var is_clean = function(status) {
            return lib.util.first(status, function(item) {
                return !item.is_clean
            }) < status.length
        }

        var status_dump = function(status) {
            return util.map(status, function(item) {
                return item.toString()
            }).join(', ')
        }

        var tag_as_latest = function() {
            git.tag(['-d', '>latest'], true)
            git.tag(['>latest'])
        }

        /**
         * load or initialize vault configuration describing
         * registered backup modules. Configuration is read-only,
         * mutable() method returns object to modify it
         */
        var mk_config = function() {
            var config_fname = ".config"
            var config_path = os.path(path, config_fname)
            var config, res
            if (os.path.isfile(config_path))
                config = JSON.parse(os.read_file(config_path))
            else
                config = {}

            var save = function() {
                os.write_file(config_path, JSON.stringify(config, null, '\t'))
            }

            res = {}

            res.modules = function() {
                return config
            }

            /// create wrapper to change configuration
            res.mutable = function() {
                var that = Object.create(res)
                that.add = function(desc) {
                    var name = desc.name
                    if (!(name && desc.script))
                        throw lib.error({msg : "Module description should contain"
                                         + " name and script"})
                    config[name] = desc
                    save()
                    git.add(config_fname)
                    git.commit("+" + name)
                }
                that.rm = function(name) {
                    if (name && (name in config)) {
                        delete config[name]
                        save()
                        git.rm(config_fname)
                        git.commit("-" + name)
                    } else {
                        throw lib.error({ msg : "Can't delete non-existing module",
                                          name : name })
                    }
                }
                return that
            }

            return res
        }

        /// lazy vault configuration loading/initialization
        var init_config = function() {
            return mk_config()
            // if (modules_config == null)
            //     modules_config = mk_config()
            // return modules_config
        }

        /// functionality related to specific module
        var mk_module = function(config, home) {
            var name = config.name
            var root_dir = os.path(git.path(), name)
            var data_dir = os.path(root_dir, "data")
            var blobs_dir = os.path(root_dir, "blobs")
            var blobs_rel = os.path(name, "blobs")
            var mkdir = os.mkdir;

            var reset = function(treeish) {
                git.clean(['-fd', '--', name])
                git.reset(['--hard', treeish])
            }

            /// execute backup script registered for the module
            var exec_script = function(action) {
                debug.debug('script', config.script, 'action', action)
                var args = ['--action', action,
                            '--dir', data_dir,
                            '--bin-dir', blobs_dir,
                            '--home-dir', home ]
                debug.info(subprocess.check_output(config.script, args))
            }

            var save_blob = function(status) {
                var target, sha, that
                var blob_dir, blob_fname, link_fname
                var git_path = status.src
                if (status.index == ' ' && status.tree == 'D')
                    return git.rm(status.src)

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
                    return util.first(status, function(item) {
                        return !item.is_tree_clean()
                    }) < status.length
                }

                var isnt_commited = function(status) {
                    return util.first(status, function(item) {
                        return !item.is_clean()
                    }) < status.length
                }

                // cleanup directories for data and blobs in
                // the repository
                os.rmtree(data_dir)
                os.rmtree(blobs_dir)
                mkdir(root_dir)
                mkdir(data_dir)
                mkdir(blobs_dir)

                exec_script('export')

                util.foreach(git.status(blobs_rel), save_blob)

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

        var backup = function(home, options, on_progress) {
            var config = init_config()
            var head, name
            var res = { succeeded :[], failed : [] }
            var modules

            var backup_module = function(name) {
                var head_before = git.rev_parse('HEAD')
                //config[name].name = name
                var module = mk_module(config.modules()[name], home)

                try {
                    on_progress({ module: name, status: "begin" })
                    module.backup()
                    on_progress({ module: name, status: "ok" })
                    res.succeeded.push(name)
                } catch (err) {
                    err.module = name
                    debug.error("Failed to backup " + name + ", reason: "
                            + err.toString())
                    on_progress({ module: name, status: "fail" })
                    res.failed.push(name)
                    module.reset(head_before)
                }
            }

            start_time_tag = sys.date().toGitTag()

            git.checkout('master')

            if (options && options.modules) {
                util.foreach(options.modules, backup_module)
            } else {
                for (name in config.modules()) {
                    backup_module(name)
                }
            }

            message = ((options && options.message)
                       ? [start_time_tag, options.message].join('\n')
                       : start_time_tag)
            os.write_file(message_file, message)
            git.add(".message")
            git.commit([start_time_tag, message].join('\n'))

            git.tag(['>' + start_time_tag])
            tag_as_latest()
            git.notes(['add', '-m', options.message || start_time_tag])
            return res
        };

        var set_current = function(tag) {
            git.checkout('>' + tag)
        }

        var restore = function(home, options, on_progress) {
            var config = init_config()
            var res = { succeeded :[], failed : [] }
            var name

            var restore_module = function(name) {
                //config[name].name = name
                var module = mk_module(config.modules()[name], home)
                try {
                    on_progress({ module: name, status: "begin" })
                    module.restore()
                    on_progress({ module: name, status: "ok" })
                    res.succeeded.push(name)
                } catch (err) {
                    err.module = name
                    debug.error("Failed to restore " + name
                                + ", reason: " + err.toString())
                    on_progress({ module: name, status: "fail" })
                    res.failed.push(name)
                }
            }

            if (options && options.modules) {
                util.foreach(options.modules, restore_module)
            } else {
                for (name in config.modules()) {
                    debug.debug("Restoring", name)
                    restore_module(name)
                }
            }
        }

        var snapshot = {
            toString : function() {
                return [this.name, this.note].join(':')
            }
        }

        var list_snapshots = function() {
            git.tag([])
            var tags = util.filter(git.stdout().toString().split('\n'),
                                   function(tag) {
                                       return (tag[0] === '>')
                                   })
            return util.map(tags, function(tag) {
                var res = Object.create(snapshot)
                res.name = tag.substr(1)
                var note = git.notes(['show', tag], true) || ""
                res.note = note.toString().trim()
                return res
            })
        }

        return Object.create({
            /// init vault git repository
            init : init,
            /// perform backup
            backup : backup,
            restore : restore,
            list_snapshots : list_snapshots,
            /// returns repository configuration
            config : mk_config,
            /// set repository head pointer to some snapshot
            set_current : set_current,
            checkout : function(treeish) { git.checkout(treeish) }
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

    var results = (function() {
        var that = function(obj) {
            if (obj.status === 'ok')
                that.succeeded.push(obj.module)
            else if (obj.status === 'fail')
                that.failed.push(obj.module)

        }
        that.succeeded = []
        that.failed = []
        return that
    }).call(this)

    mk_vault.execute = function(options) {
        var vault = mk_vault(options.vault)
        var action = options.action
        var res

        switch (action) {
        case 'init':
            res = vault.init(parse_kv_pairs(options.git_config))
            break;
        case 'backup':
            res = vault.backup(options.home,
                               {modules : [options.module],
                                message : options.message},
                               results)
            break
        case 'restore':
            if (!options.tag)
                throw lib.error({msg : "tag should be provided to restore"})
            vault.set_current(options.tag)
            res = vault.restore(options.home,
                                {modules : [options.module]},
                                results)
            break
        case 'list-snapshots':
            res = vault.list_snapshots()
            print(util.map(res, function(s) { return s.name }).join('\n'))
            break
        case 'register':
            vault.checkout('master')
            if (!options.data)
                throw lib.error({ action : action, msg : "Needs data" })
            res = vault.config().mutable().add(parse_kv_pairs(options.data))
            break;
        case 'unregister':
            vault.checkout('master')
            if (!options.module)
                throw lib.error({ action : action, msg : "Needs module name" })
            res = vault.config().mutable().rm(options.module)
            break;
        default:
            throw lib.error({ msg : "Unknown action", action : action})
            break
        }
        return res
    }

    lib.vault = mk_vault
}).call(this)
