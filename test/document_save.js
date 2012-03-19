var assert = require("assert");

var Db = require("../lib/orientdb").Db,
    Server = require("../lib/orientdb").Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

//var binary_data = new Buffer(1);
//binary_data.writeUInt8(42, 0);

var document = {
  "@class": "FantasyPerson",
  name: "it's my name",
  birthday: new Date(),
  fingers: 20,
//  fav_binary_number: binary_data,
  like_it: true,
  linked_to: "#4:0",
  last_time_in: { name: "Turin", when: new Date() },
  known_os_list: [ "linux" ],
  zero_is: null
}

db.open(function(err, result) {
    
    assert(!err, "Error while opening the database: " + err);

    db.save(document, function(err, document) {
        
        console.log(document);

        var doc_id = document["@rid"]
        assert(doc_id);
        assert.equal(0, document["@version"]);
        assert.equal("FantasyPerson", document["@class"]);
        assert.equal("it's my name", document.name);
        
        document.name = "now it's your name";
        db.save(document, function(err, document) {
            
            console.log(document);
            
            assert.equal(doc_id, document["@rid"]);
            assert.equal("now it's your name", document.name);
            assert.equal(1, document["@version"]);
      
            db.close();
        });
    });
    
});

