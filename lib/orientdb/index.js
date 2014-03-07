"use strict";

// Map all the classes
var modules = [
    'server',
    'db',
    'graphdb'
];

modules.forEach(function(path) {
    var module = require('./' + path);
    for (var idx in module) {
        exports[idx] = module[idx];
    }
});

exports.RecordID = exports.RecordId = require('./recordid');