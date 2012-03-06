var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    db.size(function(err, size) {

        if (err) { console.log(err); return; }

        if (typeof size !== 'number') {
            throw new Error('The result must be a boolean value. Received: ' + (typeof size));
        }

        console.log('Database size: ' + size);

        db.close(function(err) {
    
            if (err) { console.log(err); return; }
        });
    });
});

