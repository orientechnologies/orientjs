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

        db.begin(function(err) {
            assert(!err, err);
            
            assert.equal(-1, db.transaction.clusterPosition);
            assert.equal(0, db.transaction.docs.length);

            db.save({ "@class": "user", name: "first", surname: "first" }, function(err, firstDoc) {
                assert(!err, err);

                assert.equal(-2, db.transaction.clusterPosition);
                assert.equal(1, db.transaction.docs.length);

                console.log(arguments);

                firstDoc.name = "first doc name";
                firstDoc.surname = "first doc surname";

                db.save(firstDoc, function(err, firstDoc) {
                    assert(!err, err);

                    assert.equal(-2, db.transaction.clusterPosition);
                    assert.equal(1, db.transaction.docs.length);

                    console.log(arguments);

                    db.save({ "@class": "user", name: "second doc name", surname: "second doc surname" }, function(err, secondDoc) {
                        assert(!err, err);

                        assert.equal(-3, db.transaction.clusterPosition);
                        assert.equal(2, db.transaction.docs.length);

                        console.log(arguments);

                        db.save({ "@class": "link", link_to_first: firstDoc["@rid"], link_to_second: secondDoc["@rid"]}, function(err, link) {
                            assert(!err, err);

                            assert.equal(-4, db.transaction.clusterPosition);
                            assert.equal(3, db.transaction.docs.length);

                            console.log(arguments);

                            db.commit(function(err) {
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