var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;


var dbConfig = {
    userName: "admin",
    userPassword: "admin"
};
var serverConfig = {
    host: 'localhost',
    port: 2424,
    userName: "root",
    userPassword: "83CACE21A23DB46F93BFD58A3CE48C8D29926C6EF424D7DA9BD725AE070CCDC0"
};

var server = new Server(serverConfig);
var db = new Db('test', server, dbConfig);


server.connect(function(error, sessionId) {
    if(error) {
    	console.log(error);
		return;
	}

    console.log("Connected on session: " + sessionId);

    db.create(function(error) {
        if(error) {
			console.log(error);
			return;
		}
    
        console.log("Created database: " + db.databaseName);

        db.delete(function(error) {
            if(error) {
				console.log(error);
				return;
			}

            console.log("Deleted database");

            db.close();
        });
    });
});

