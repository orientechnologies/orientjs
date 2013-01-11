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

    prepareDatabase(function(err) {
        assert(!err, err);

        var transaction = db.begin();

        assert.equal(-1, transaction.clusterPosition);
        assert.equal(0, transaction.docs.length);

        db.save({ "@class": "user", name: "first", surname: "first" }, transaction, function(err, firstDoc) {
            assert(!err, err);

            assert.equal(-2, transaction.clusterPosition);
            assert.equal(1, transaction.docs.length);

            console.log(arguments);

            firstDoc.name = "first doc name";
            firstDoc.surname = "first doc surname";

            db.save(firstDoc, transaction, function(err, firstDoc) {
                assert(!err, err);

                assert.equal(-2, transaction.clusterPosition);
                assert.equal(1, transaction.docs.length);

                console.log(arguments);

                db.save({ "@class": "user", name: "second doc name", surname: "second doc surname" }, transaction, function(err, secondDoc) {
                    assert(!err, err);

                    assert.equal(-3, transaction.clusterPosition);
                    assert.equal(2, transaction.docs.length);

                    console.log(arguments);

                    db.save({ "@class": "link", link_to_first: firstDoc["@rid"], link_to_second: secondDoc["@rid"]}, transaction, function(err, link) {
                        assert(!err, err);

                        assert.equal(-4, transaction.clusterPosition);
                        assert.equal(3, transaction.docs.length);

                        console.log(arguments);

                        db.commit(transaction, function(err) {
                            if (err) db.rollback();

                            console.log(arguments);

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
    db.createClass("user", function(err) {
        if (err) return callback(err);

        db.createClass("link", callback);
    });
}

function unprepareDatabase(callback) {
    db.dropClass("user", function(err) {
        if (err) return callback(err);

        db.dropClass("link", callback);
    });

}