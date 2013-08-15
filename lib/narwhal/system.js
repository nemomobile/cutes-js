
// -- tlrobinson Tom Robinson
var that = {}

that.stdin  = {};/*TODO*/
that.stdout = {};/*TODO*/
that.stderr = {};/*TODO*/

that.args = cutes.module.args;

that.env = cutes.env;

that.fs = {}; //TODO require('./file');

// default logger
var Logger = function() {}; // TODO require("./logger").Logger;
that.log = new Logger(that.stderr);

exports = that;



