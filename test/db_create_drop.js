var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server = new Server(serverConfig);
var db = new Db('test_create_drop', server, dbConfig);


server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    db.create(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log('Created database: ' + db.databaseName);

        db.drop(function(err) {

            if (err) { console.log(err); return; }

            console.log('Dropped database');

            server.disconnect();
        });
    });
});

