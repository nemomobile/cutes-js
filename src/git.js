(function () {
    if (lib.git != undefined)
        return

    qtscript.load("subprocess.js")
    qtscript.load("util.js")
    var debug = lib.debug

    var rename_ops = { "R" : "R", "C" : "C" }

    var status_item = {
        is_clean : function() { return (this.index == ' '
                                        && this.tree == ' ') },
        is_tree_clean : function() { return this.tree == ' ' },
        toString : function() {
            return this.index + this.tree + ' ' + this.src
        }
    }

    var parse_status = function(items) {
        var res = []
        for (var i = 0; i < items.length; ++i) {
            var s = String(items[i])
            if (s.length < 1)
                continue
            if (s.length < 4 && s[2] != " ")
                throw lib.error({ msg : "Unexpected status format, need XX ...",
                                  format : s })
            var item = Object.create(status_item)
            item.index = s[0]
            item.tree = s[1]
            item.src = s.substr(3)
            if (rename_ops[item.index] || rename_ops[item.tree]) {
                if (++i == items.length)
                    throw lib.error({ msg : "No dst after rename op",
                                      format : s})
                item.dst = items[i]
            }
            res.push(item)
        }
        return res
    }

    var factory = function(storage_path) {
        var ps = lib.subprocess.process({ cwd : storage_path })

        var execute = function(cmd, params, can_fail) {
            debug.debug("git", cmd, params)
            var fn = can_fail ? ps.call : ps.check_call
            return fn('git', params ? [cmd].concat(params) : [cmd])
        }

        var status = function(path, can_fail) {
            var params = ["-z"]
            if (path && path != "")
                params = params.concat(["--", path])
            var rc = execute('status', params, can_fail)
            return (rc ? rc : parse_status(ps.stdout().split("\0")))
        }

        var add = function(path, params, can_fail) {
            params = params || []
            return execute('add', params.concat([path]), can_fail)
        }

        var rm = function(path, params, can_fail) {
            params = params || []
            return execute('rm', params.concat([path]), can_fail)
        }

        var commit = function(msg, params, can_fail) {
            params = params || []
            return execute('commit', params.concat(['-m', msg]), can_fail)
        }

        var config = function(values, can_fail) {
            var rc, k
            for (k in values) {
                rc = execute('config', [k, values[k]], can_fail)
                if (rc)
                    return rc
            }
            return 0
        }

        var basic_cmd = function(name) {
            return function(params, can_fail) {
                return execute(name, params, can_fail)
            }
        }

        var exec_stdout = function(name, params, can_fail) {
            if (params === undefined)
                params = []
            var rc = execute(name, params, can_fail)
            return (rc ? undefined : ps.stdout())
        }

        var cmd_basic_result = function(name) {
            return function(params, can_fail) {
                return exec_stdout(name, params, can_fail)
            }
        }

        var getline = function() {
            var rc = execute.apply(null, [].slice.call(arguments))
            return (rc ? undefined
                    : ps.stdout().split('\n')[0].toString().trim())
        }

        var hash_object = function(path) {
            return getline('hash-object', [path])
        }

        var rev_parse = function(rev) {
            return getline('rev-parse', [rev])
        }

        var tag = function(params, can_fail) {
            return execute('tag', params || [], can_fail)
        }

        var checkout = function(commit, params, can_fail) {
            params = params || []
            return execute('checkout', [commit].concat(params), can_fail)
        }

        return {
            status : status,
            config : config,
            add : add,
            rm : rm,
            commit : commit,
            init : basic_cmd('init'),
            reset : basic_cmd('reset'),
            clean : basic_cmd('clean'),
            hash_object : hash_object,
            rev_parse : rev_parse,
            tag : tag,
            checkout : checkout,
            show : cmd_basic_result('show'),
            execute : execute, // any git command
            returncode : function() { return ps.returncode() },
            stdout : function() { return ps.stdout() },
            stderr : function() { return ps.stderr() },
            path : function() { return storage_path }
        }
    }

    lib.git = factory

}).call(this)
