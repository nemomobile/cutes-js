
// -- tlrobinson Tom Robinson
var that = {}

that.stdin  = {};/*TODO*/
that.stdout = {};/*TODO*/
that.stderr = {};/*TODO*/

that.args = qtscript.module.args;

that.env = qtscript.env;

that.fs = {}; //TODO require('./file');

// default logger
var Logger = function() {}; // TODO require("./logger").Logger;
that.log = new Logger(that.stderr);

exports = that;



