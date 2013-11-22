var v1 = cutes;
if (v1 === undefined)
    throw "No cutes";

var m = module;
if (m === undefined)
    throw "No module";

var local_module = require("local-module.js");
if (local_module === undefined)
    throw "Can't import local-module.js";

if (typeof(local_module) !== 'function')
    throw "Expected function from local-module.js, got " + typeof(local_module);

var res = local_module();
if (local_module() !== "ok")
    throw "Expected 'ok', got " + res;

var local_module2 = require("local-module");
if (local_module2 === undefined)
    throw "Can't import local-module";

if (local_module2 !== local_module)
    throw "local-module !== local-module.js??";
