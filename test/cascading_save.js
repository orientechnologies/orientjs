var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");
var _ = require("underscore");

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
            assert(!_.isUndefined(savedDoc["@rid"]));
            assert(!_.isUndefined(savedDoc["@type"]));
            assert(!_.isUndefined(savedDoc["@class"]));
            assert(!_.isUndefined(savedDoc["@version"]));
            assert(!_.isUndefined(savedDoc.sub_document["@rid"]));
            assert(!_.isUndefined(savedDoc.sub_document["@type"]));
            assert(!_.isUndefined(savedDoc.sub_document["@class"]));
            assert(!_.isUndefined(savedDoc.sub_document["@version"]));
            assert(!_.isUndefined(savedDoc.sub_document.sub_sub_document["@rid"]));
            assert(!_.isUndefined(savedDoc.sub_document.sub_sub_document["@type"]));
            assert(!_.isUndefined(savedDoc.sub_document.sub_sub_document["@class"]));
            assert(!_.isUndefined(savedDoc.sub_document.sub_sub_document["@version"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0]["@rid"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0]["@type"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0]["@class"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0]["@version"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@rid"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@type"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@class"]));
            assert(!_.isUndefined(savedDoc.sub_documents[0].sub_sub_document["@version"]));
            assert(!_.isUndefined(savedDoc.sub_documents[1]["@rid"]));
            assert(!_.isUndefined(savedDoc.sub_documents[1]["@type"]));
            assert(!_.isUndefined(savedDoc.sub_documents[1]["@class"]));
            assert(!_.isUndefined(savedDoc.sub_documents[1]["@version"]));
            assert(!_.isUndefined(savedDoc.linked_map.link1["@rid"]));
            assert(!_.isUndefined(savedDoc.linked_map.link1["@type"]));
            assert(!_.isUndefined(savedDoc.linked_map.link1["@class"]));
            assert(!_.isUndefined(savedDoc.linked_map.link1["@version"]));

            unprepareDatabase(function(err) {
                assert(!err, err);

                db.close();
            });
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


function unprepareDatabase(callback) {
    db.dropClass("subClass", function(err) {
        if (err) return callback(err);

        db.dropClass("mainClass", callback);
    });
}