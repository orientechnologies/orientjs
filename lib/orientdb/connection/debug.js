var util = require("util"),
    parser = require("./parser"),
    options;

/*------------------------------------------------------------------------------
 (public) options

 + options
 - void

 Constructor - set up debug.
 ------------------------------------------------------------------------------*/
module.exports.options = function(optionsArg) {
    options = {
        logOperations: optionsArg.logOperations || false,
        logErrors: optionsArg.logErrors || false,
        color: 1
    };
};

/*------------------------------------------------------------------------------
 (public) log

 + message

 Output message to stdout.
 ------------------------------------------------------------------------------*/
module.exports.log = function(message) {
    if (options.logOperations) {
        util.log(
            "OrientDB debug: " +
                message
        );
    }
};

/* recursive through objects */

module.exports.look = function(obj) {
    var A = [], tem;
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            tem = obj[p];
            if (tem && parser.isObject(tem)) {
                A[A.length] = p + ':{ ' + arguments.callee(tem).join(', ') + '}';
            }
            else A[A.length] = ["\t" + p + ':' + tem.toString() + "\n"];
        }
    }
    return A;
};
