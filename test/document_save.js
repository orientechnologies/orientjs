var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

//var binary_data = new Buffer(1);
//binary_data.writeUInt8(42, 0);

var name1 = "IIIIIIIIIIIIIII",
    name2 = "OOOOOOOOOOOOOOO",
    clazz = "FantasyPerson";

var document = {
    "@class": clazz,
    name: name1,
    birthday: new Date(),
    fingers: 20,
    //fav_binary_number: binary_data,
    like_it: true,
    linked_to: "#4:0",
    last_time_in: { name: "Turin", when: new Date() },
    known_os_list: [ "linux" ],
    zero_is: null
};

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);

    // save the first version of the document
    db.save(document, function(err, document) {

        console.log("Saved document: " + JSON.stringify(document));

        var doc_id = document["@rid"];

        assert.equal(clazz, document["@class"]);
        assert(doc_id);
        assert.equal(0, document["@version"]);
        assert.equal(name1, document.name);

        // change the name
        document.name = name2;

        // save the sexond version of the document
        db.save(document, function(err, document) {

            console.log("Updated document: " + JSON.stringify(document));

            assert.equal(doc_id, document["@rid"]);
            assert.equal(1, document["@version"]);
            assert.equal(name2, document.name);

            db.delete(document, function(err, result) {
                console.log("document deleted");
                
                db.close();
            });
        });
    });
});

