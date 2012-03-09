var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');
var dbConfig = require('../config/test/dbConfig');

var server1 = new Server(serverConfig);
var db1 = new Db('temp', server1, dbConfig);

var server2 = new Server(serverConfig);
var db2 = new Db('temp', server2, dbConfig);


db1.open(function(err, result) {

    if (err) { console.log(err); return; }

    console.log('Connection 1 established');

    db2.open(function(err, result) {

        if (err) { console.log(err); return; }

        console.log('Connection 2 established');

        db1.countRecords(function(err, count) {

            if (err) { console.log(err); return; }

            if (typeof count !== 'number') {
                throw new Error('The result must be a boolean value. Received: ' + (typeof count));
            }

            console.log('Record count through connection 1: ' + count);

            db2.countRecords(function(err, count) {

                if (err) { console.log(err); return; }

                if (typeof count !== 'number') {
                    throw new Error('The result must be a boolean value. Received: ' + (typeof count));
                }

                console.log('Record count through connection 2: ' + count);

                db1.close(function(err) {

                    if (err) { console.log(err); return; }

                    console.log('Connection 1 closed');

                    db2.close(function(err) {

                        if (err) { console.log(err); return; }

                        console.log('Connection 2 closed');
                    });
                });
            });
        });
    });
});

