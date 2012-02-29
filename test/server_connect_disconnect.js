var Server = require('../lib/orientdb').Server;


var serverConfig = {
    host: 'localhost',
    port: 2424,
    user_name: "root",
    user_password: "83CACE21A23DB46F93BFD58A3CE48C8D29926C6EF424D7DA9BD725AE070CCDC0"
};

var server = new Server(serverConfig);


server.connect(function(err, sessionId) {

    if (err) { console.log(err); return; }

    console.log("Connected on session: " + sessionId);

    server.disconnect(function(err) {
        
        if (err) { console.log(err); return; }
    
        console.log("Closed connection");
    });
});

