"use strict";

// Map all the classes
var modules = [
    'connection/server',
    'db',
    'graphdb'
];

modules.forEach(function(path) {
    var module = require('./' + path);
    for (var idx in module) {
        exports[idx] = module[idx];
    }
});

