var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

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
            "@type": "d",
            sub_sub_document: {
                "@class": "subClass",
                sub_field: 50,
                "@type": "d"
            }
        },
        sub_documents: [
            {
                "@class": "subClass",
                sub_field: 2,
                "@type": "d",
                sub_sub_document: {
                    "@class": "subClass",
                    sub_field: 99,
                    "@type": "d"
                }
            },
            {
                "@class": "subClass",
                sub_field: 3,
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
            assert(!parser.isUndefined(savedDoc["@rid"]));
            assert(!parser.isUndefined(savedDoc["@type"]));
            assert(!parser.isUndefined(savedDoc["@class"]));
            assert(!parser.isUndefined(savedDoc["@version"]));
            assert(!parser.isUndefined(savedDoc.sub_document["@rid"]));
            assert(!parser.isUndefined(savedDoc.sub_document["@type"]));
            assert(!parser.isUndefined(savedDoc.sub_document["@class"]));
            assert(!parser.isUndefined(savedDoc.sub_document["@version"]));
            assert(!parser.isUndefined(savedDoc.sub_document.sub_sub_document["@rid"]));
            assert(!parser.isUndefined(savedDoc.sub_document.sub_sub_document["@type"]));
            assert(!parser.isUndefined(savedDoc.sub_document.sub_sub_document["@class"]));
            assert(!parser.isUndefined(savedDoc.sub_document.sub_sub_document["@version"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0]["@rid"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0]["@type"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0]["@class"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0]["@version"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@rid"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@type"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@class"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@version"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[1]["@rid"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[1]["@type"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[1]["@class"]));
            assert(!parser.isUndefined(savedDoc.sub_documents[1]["@version"]));
            assert(!parser.isUndefined(savedDoc.linked_map.link1["@rid"]));
            assert(!parser.isUndefined(savedDoc.linked_map.link1["@type"]));
            assert(!parser.isUndefined(savedDoc.linked_map.link1["@class"]));
            assert(!parser.isUndefined(savedDoc.linked_map.link1["@version"]));

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
        