var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;


var dbConfig = {
    userName: "admin",
    userPassword: "admin"
};
var serverConfig = {
    host: "localhost",
    port: 2424,
    user_name: "root",
    user_password: "83CACE21A23DB46F93BFD58A3CE48C8D29926C6EF424D7DA9BD725AE070CCDC0"
};

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(error, results) {
    if(error) {
		console.log(error);
		return;
	}

    console.log("Opened database on session: " + results.sessionId);
    console.log("Database '" + db.databaseName + "' has " + db.clusters.length + " clusters");

    db.size(function(err, size) {
        if(error) {
			console.log(error);
			return;
		}

        console.log("Database size: " + size);

        db.close();
    });
});

