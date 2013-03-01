var that = {};

that.sleep = function(ms) {
    var lock = new QMutex();
    lock.lock();
    try {
        lock.tryLock(ms);
    } finally {
        lock.unlock();
    }
};

exports = that;
