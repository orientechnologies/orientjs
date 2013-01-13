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

    prepareDatabase(function(err, userClusterId, linkClusterId) {
        assert(!err, err);

        var transaction = db.begin();

        assert.equal(-1, transaction.clusterPosition);
        assert.equal(0, transaction.docs.length);

        var firstDoc = {
            "@class": "user",
            name: "first",
            surname: "first"
        };
        db.save(firstDoc, transaction, function(err, firstDoc) {
            assert(!err, err);

            assert.equal(-2, transaction.clusterPosition);
            assert.equal(1, transaction.docs.length);

            firstDoc.name = "first doc name";
            firstDoc.surname = "first doc surname";

            db.save(firstDoc, transaction, function(err, firstDoc) {
                assert(!err, err);

                assert.equal(-2, transaction.clusterPosition);
                assert.equal(1, transaction.docs.length);

                var secondDoc = {
                    "@class": "user",
                    name: "second doc name",
                    surname: "second doc surname"
                };
                db.save(secondDoc, transaction, function(err, secondDoc) {
                    assert(!err, err);

                    assert.equal(-3, transaction.clusterPosition);
                    assert.equal(2, transaction.docs.length);

                    var link = {
                        "@class": "link",
                        link_to_first: firstDoc["@rid"],
                        link_to_second: secondDoc["@rid"]
                    };
                    db.save(link, transaction, function(err, link) {
                        assert(!err, err);

                        assert.equal(-4, transaction.clusterPosition);
                        assert.equal(3, transaction.docs.length);

                        /*
                         transaction.docs[0]["@rid"] = "#" + userClusterId + ":-2";
                         transaction.docs[1]["@rid"] = "#" + userClusterId + ":-3";
                         transaction.docs[2]["@rid"] = "#" + linkClusterId + ":-4";
                         transaction.docs[2].link_to_first = transaction.docs[0]["@rid"];
                         transaction.docs[2].link_to_second = transaction.docs[1]["@rid"];
                         */

                        console.log(transaction);

                        db.commit(transaction, function(err, result) {
                            if (err) db.rollback(transaction);

                            console.log(result);

                            assert.equal(3, result.numberOfRecordsCreated);
                            assert.equal(-1, result.recordsCreated[0].fromClusterId);
                            assert.equal(-3, result.recordsCreated[0].fromClusterPosition);
                            assert.equal(8, result.recordsCreated[0].toClusterId);
                            assert.equal(1, result.recordsCreated[0].toClusterPosition);
                            assert.equal(-1, result.recordsCreated[1].fromClusterId);
                            assert.equal(-2, result.recordsCreated[1].fromClusterPosition);
                            assert.equal(8, result.recordsCreated[1].toClusterId);
                            assert.equal(0, result.recordsCreated[1].toClusterPosition);
                            assert.equal(-1, result.recordsCreated[2].fromClusterId);
                            assert.equal(-4, result.recordsCreated[2].fromClusterPosition);
                            assert.equal(9, result.recordsCreated[2].toClusterId);
                            assert.equal(0, result.recordsCreated[2].toClusterPosition);

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
});

function prepareDatabase(callback) {
    db.createClass("user", function(err, userClusterId) {
        if (err) return callback(err);

        db.createClass("link", function(err, linkClusterId) {
            if (err) return callback(err);

            callback(null, userClusterId, linkClusterId);
        });
    });
}

function unprepareDatabase(callback) {
    return callback()
    db.dropClass("user", function(err) {
        if (err) return callback(err);

        db.dropClass("link", callback);
    });

}