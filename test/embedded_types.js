var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

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

    prepareDatabase(function(err) {
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
});

function prepareDatabase(callback) {
    db.createClass("userInfo", function(err) {
        if (err) { return callback(err); }

        db.createClass("objProperties", function(err) {
            if (err) { return callback(err); }

            db.command("CREATE PROPERTY userInfo.commonProperties link objProperties", function(err) {
                if (err) { return callback(err); }

                db.command("CREATE PROPERTY userInfo.linked_map linkmap objProperties", function(err) {
                    callback(err);
                });
            });
        });
    });
}

function unprepareDatabase(callback) {
    db.dropClass("userInfo", function(err) {
        if (err) { return callback(err); }

        db.dropClass("objProperties", callback);
    });
}

