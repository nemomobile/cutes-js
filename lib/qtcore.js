require("util.js");
qtscript.extend('qt.core');
QByteArray.method('toString', function() {
    var s = new QTextStream(this, QIODevice.ReadOnly);
    return s.readAll();
});
