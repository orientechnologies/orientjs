var assert = require("assert");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);


db.open(function(err, result) {

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
        "@type": "d" };

    db.createClass("userInfo", function(err) {
        assert(!err, err);

        db.createClass("objProperties", function(err) {
            assert(!err, err);
            db.command("CREATE PROPERTY userInfo.commonProperties link objProperties", function(err) {
                assert(!err, err);
                
                db.save(doc.commonProperties, function(err, savedCommonProperties) {
                    assert(!err, err);
                    doc.commonProperties = savedCommonProperties["@rid"]
                    
                    db.save(doc, function(err, savedDoc) {
                        assert(!err, err);
                        
                        console.log(savedDoc);

                        db.close();
                    });
                });

            })
        });
    });

});