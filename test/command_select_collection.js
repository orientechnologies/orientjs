var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


db.open(function(err, result) {

    if (err) { console.log(err); return; }

    db.command('SELECT FROM OUser', function(err, result) {
 
        if (err) { console.log(err); return; }
 
        console.log('Received results: ' + JSON.stringify(result));

        db.close();
    });
});

