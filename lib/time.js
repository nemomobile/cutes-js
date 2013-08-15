var Q = require('qtcore');

exports.sleep = function(ms) {
    var lock = new Q.Mutex();
    lock.lock();
    try {
        lock.tryLock(ms);
    } finally {
        lock.unlock();
    }
};
