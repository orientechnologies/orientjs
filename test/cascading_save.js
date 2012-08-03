var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err) {

    assert(!err, "Error while opening the database: " + err);

    var doc = {
        "@class": "mainClass",
        field: "field value",
        embeddded_list_of_maps: [
            {
                key1: "value1",
                key2: "value2"
            }
        ],
        sub_document: {
            "@class": "subClass",
            sub_field: 1,
            "@type": "d"
        },
        sub_documents: [
            {
                "@class": "subClass",
                sub_field: 2,
                "@type": "d"
            }
        ],
        linked_map: {
            link1: {
                "@class": "subClass",
                another_field: "another_value",
                "@type": "d"
            }
        },
        "@type": "d"
    };

    prepareDatabase(function(err) {
        assert(!err, err);

        db.cascadingSave(doc, function(err, savedDoc) {
            assert(!err, err);
            assert(typeof savedDoc["@rid"] !== "undefined");
            assert(typeof savedDoc["@type"] !== "undefined");
            assert(typeof savedDoc["@class"] !== "undefined");
            assert(typeof savedDoc["@version"] !== "undefined");
            assert(typeof savedDoc.sub_document["@rid"] !== "undefined");
            assert(typeof savedDoc.sub_document["@type"] !== "undefined");
            assert(typeof savedDoc.sub_document["@class"] !== "undefined");
            assert(typeof savedDoc.sub_document["@version"] !== "undefined");
            assert(typeof savedDoc.linked_map.link1["@rid"] !== "undefined");
            assert(typeof savedDoc.linked_map.link1["@type"] !== "undefined");
            assert(typeof savedDoc.linked_map.link1["@class"] !== "undefined");
            assert(typeof savedDoc.linked_map.link1["@version"] !== "undefined");

            db.close();
        });
    });
});

function prepareDatabase(callback) {
    db.createClass("mainClass", function(err) {
        if (err) return callback(err);

        db.createClass("subClass", function(err) {
            if (err) return callback(err);

            db.command("CREATE PROPERTY mainClass.sub_document link subClass", function(err) {
                if (err) return callback(err);

                db.command("CREATE PROPERTY mainClass.sub_documents linklist subClass", function(err) {
                    if (err) return callback(err);


                    db.command("CREATE PROPERTY mainClass.linked_map linkmap subClass", function(err) {
                        if (err) return callback(err);

                        callback();
                    });
                });
            });
        });
    });
}
        