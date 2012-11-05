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

    var doc = { "@class": "userInfo",
        firstName: "pippo",
        lastName: "pappo",
        cellNumber: undefined,
        gender: "m",
        deviceList: [],
        socialTokens: [
            { sn: "google2",
                token: "reqrbqipwuebrq5ipu4bwr9b1w40rqwor47br8qwo467brfoqiw4bfoibqw4i7f" }
        ],
        commonProperties: { objType: "userInfo",
            "@class": "objProperties",
            deletedAt: null,
            "@type": "d" },
        linked_map: {
            link1: {
                '@class': 'objProperties',
                key: "value"
            }
        },
        "@type": "d" };

    db.createClass("userInfo", function(err) {
        assert(!err, err);

        db.createClass("objProperties", function(err) {
            assert(!err, err);

            db.command("CREATE PROPERTY userInfo.commonProperties link objProperties", function(err) {
                assert(!err, err);

                db.command("CREATE PROPERTY userInfo.linked_map linkmap objProperties", function(err) {
                    assert(!err, err);
                    
                    db.save(doc.commonProperties, function(err, savedCommonProperties) {
                        assert(!err, err);
                        doc.commonProperties = savedCommonProperties["@rid"];

                        db.save(doc.linked_map.link1, function(err, savedLink1) {
                            assert(!err, err);

                            doc.linked_map.link1 = savedLink1["@rid"];

                            db.save(doc, function(err, savedDoc) {
                                assert(!err, err);

                                db.loadRecord(savedDoc["@rid"], function(err, newDoc) {

                                    assert.equal(doc.linked_map.link1, newDoc.linked_map.link1);
                                    assert.equal(doc.commonProperties, newDoc.commonProperties);

                                    // remove now the created class to leave a clean environement
                                    unprepareDatabase(function(err) {
                                        assert(!err, err);
                                        db.close();
                                    });
                                });
                            });
                        });
                    });
                });
            })
        });
    });
});

// TODO complete this functionality when the following issue is solved
// https://github.com/gabipetrovay/node-orientdb/issues/83
function unprepareDatabase(callback) {
    callback();
}

