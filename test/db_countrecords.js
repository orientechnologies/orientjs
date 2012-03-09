var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    db.countRecords(function(err, count) {

        if (err) { console.log(err); return; }

        if (typeof count !== 'number') {
            throw new Error('The result must be a boolean value. Received: ' + (typeof count));
        }

        console.log('Record count: ' + count);

        db.close();
    });
});

