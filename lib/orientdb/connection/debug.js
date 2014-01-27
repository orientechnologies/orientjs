"use strict";

var util = require("util"),
    parser = require("./parser"),
    _ = require("lodash"),
    options;

/*------------------------------------------------------------------------------
 (public) options

 + options
 - void

 Constructor - set up debug.
 ------------------------------------------------------------------------------*/
var initOptions = function(optionsArg) {
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
var log = function(message) {
	console.log('OrientDB debug: ' + message);
    if (options.logOperations) {
        util.log('OrientDB debug: ' + message);
    }
};

/* recursive through objects */

var look = function(obj) {
    var A = [], tem, p;
    for (p in obj) {
        if (obj.hasOwnProperty(p)) {
            tem = obj[p];
            if (tem && _.isObject(tem)) {
                A[A.length] = p + ':{ ' + look(tem).join(', ') + '}';
            } else {
                A[A.length] = ["\t" + p + ':' + tem.toString() + "\n"];
            }
        }
    }
    return A;
};

module.exports.look = look;
module.exports.log = log;
module.exports.options = initOptions;