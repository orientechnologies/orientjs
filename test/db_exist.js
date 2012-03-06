var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('temp', server, dbConfig);


server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    db.exist(function(err, result) {

        if (err) { console.log(err); return; }

        if (typeof result !== 'boolean') {
            throw new Error('The result must be a boolean value. Received: ' + (typeof result));
        }
        
        if (!result) {
            throw new Error('The 'temp' database should be present if you managed to open it.');
        }

        console.log('Database exists');

        server.disconnect(function(err) {
            
            if (err) { console.log(err); return; }
        });
    });
});

