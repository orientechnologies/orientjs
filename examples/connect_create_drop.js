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

db.connect(function(error, sessionId) {
    if(error) {
    	console.log(error);
		return;
	}

    console.log('Connected on session: ' + sessionId);

    db.create(function(error) {
        if(error) {
			db.close();
			console.log(error);
			return;
		}
    
        console.log('Created database: ' + db.databaseName);

        db.delete(function(error) {
			db.close();

            if(error) {
				console.log(error);
				return;
			}

            console.log('Deleted database');
        });
    });
});