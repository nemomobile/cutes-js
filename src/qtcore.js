
(function() {
    qtscript.use('qt.core')
    qtscript.load('util.js')
    QByteArray.method('toString', function() {
        var s = new QTextStream(this, QIODevice.ReadOnly)
        return s.readAll()
    })
}).call(this)
