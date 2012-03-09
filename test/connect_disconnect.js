var Server = require('../lib/orientdb').Server;

var serverConfig = require('../config/test/serverConfig');

var server = new Server(serverConfig);


server.connect(function(err, sessionId) {
debugger;
    if (err) { console.log(err); return; }

    console.log('Connected on session: ' + sessionId);

    server.disconnect(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log('Closed connection');
    });
});

