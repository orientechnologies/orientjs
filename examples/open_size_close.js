var Db	= require('../lib/orientdb').GraphDb;

var dbConfig = {
	//Server
	server_host: 'localhost',
	server_port: 2424,
	server_userName:'admin',
	server_password:'admin',

	//Database
	database_name:'test',
	database_userName:'admin',
	database_password:'admin'
};

var db = new Db(dbConfig);

db.open(function(error, results) {
    if(error) {
		db.close();
		console.log(error);
		return;
	}

    console.log('Opened database on session: ' + results.sessionId);
    console.log('Database "' + db.databaseName + '" has ' + db.clusters.length + ' clusters');

    db.size(function(err, size) {
		db.close();

        if(error) {
			console.log(error);
			return;
		}

        console.log('Database size: ' + size);
    });
});