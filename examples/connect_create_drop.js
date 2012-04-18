var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;


var dbConfig = {
    user_name: "admin",
    user_password: "admin"
};
var serverConfig = {
    host: 'localhost',
    port: 2424,
    user_name: "root",
    user_password: "83CACE21A23DB46F93BFD58A3CE48C8D29926C6EF424D7DA9BD725AE070CCDC0"
};

var server = new Server(serverConfig);
var db = new Db('test', server, dbConfig);


server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    console.log("Connected on session: " + sessionId);

    db.create(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log("Created database: " + db.databaseName);

        db.drop(function(err) {

            if (err) { console.log(err); return; }

            console.log("Deleted database");

            db.close(function(err) {
    
                if (err) { console.log(err); return; }
    
                console.log("Closed connection");
            });
        });
    });
});

