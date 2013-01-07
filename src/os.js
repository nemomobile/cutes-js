(function() {
    var mkdir = function(path) {
        var d = new QDir(path);
        if (d.exists())
            return false;

        var name = d.dirName();
        if (!d.cdUp())
            throw lib.error({ msg : "mkdir: Parent dir is unaccesible",
                              path : path });
        if (!d.mkdir(path))
            throw lib.error({ msg : "Can't create " + name, path :  d.path()});
        return true;
    };

    var system = function(cmd) {
        var p = new QProcess();
        p.start(cmd, [].slice.call(arguments, 1));
        p.waitForFinished();
        return p.exitStatus();
    };

    var read_file = function(file_name) {
        var f = new QFile(file_name);
        f.open(QIODevice.ReadOnly);
        try {
            return f.readAll();
        } finally {
            f.close();
        }
    };

    lib.os = {
        mkdir : mkdir,
        system : system,
        read_file : read_file
    };
}).call(this);
