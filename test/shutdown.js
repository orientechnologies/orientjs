var Db = require('../lib/orientdb').Db,
    Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');

var server = new Server(serverConfig);


server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    server.shutdown(function(err) {

        if (err) { console.log(err); return; }
        
        console.log('Server shut down');
    });
});

