var root = "../../",
    assert = require("assert"),
    orient = require(root + "lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server,
    serverConfig = require(root + "config/test/serverConfig"),
    dbConfig = require(root + "config/test/dbConfig"),
    server = new Server(serverConfig),
    db = new Db("ah463qar;wh5", server, dbConfig);

db.open(function(err) {
    assert(err, "An error should have occurred since the database should not exist.");

    db.close();
});
