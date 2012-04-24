// Map all the classes
var modules = [
    'connection/server',
    'db',
    'graphdb'
];

modules.forEach(function(path) {
    var module = require('./' + path);
    for (var i in module) {
        exports[i] = module[i];
    }
});

