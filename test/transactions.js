var assert = require("assert"),
    async = require("async");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

var userClusterId, linkClusterId, transaction, firstDoc, secondDoc, link;

async.waterfall([
    function(callback) {
        db.open(callback);
    },
    function(callback) {
        prepareDatabase(callback);
    },
    function(_userClusterId, _linkClusterId, callback) {
        userClusterId = _userClusterId;
        linkClusterId = _linkClusterId;
        transaction = db.begin();

        assert.equal(-1, transaction.clusterPosition);
        assert.equal(0, transaction.docs.length);

        firstDoc = {
            "@class": "user",
            name: "first",
            surname: "first"
        };

        db.save(firstDoc, transaction, callback);
    },
    function(_firstDoc, callback) {
        firstDoc = _firstDoc;

        assert.equal(-2, transaction.clusterPosition);
        assert.equal(1, transaction.docs.length);

        firstDoc.name = "first doc name";
        firstDoc.surname = "first doc surname";

        db.save(firstDoc, transaction, callback);
    },
    function(_firstDoc, callback) {
        firstDoc = _firstDoc;

        assert.equal(-2, transaction.clusterPosition);
        assert.equal(1, transaction.docs.length);

        secondDoc = {
            "@class": "user",
            name: "second doc name",
            surname: "second doc surname"
        };
        db.save(secondDoc, transaction, callback);
    },
    function(_secondDoc, callback) {
        secondDoc = _secondDoc;

        assert.equal(-3, transaction.clusterPosition);
        assert.equal(2, transaction.docs.length);

        link = {
            "@class": "link",
            link_to_first: firstDoc["@rid"],
            link_to_second: secondDoc["@rid"]
        };

        db.save(link, transaction, callback);
    },
    function(_link, callback) {
        link = _link;

        assert.equal(-4, transaction.clusterPosition);
        assert.equal(3, transaction.docs.length);

        transaction.docs[0]["@rid"] = "#" + userClusterId + ":-2";
        transaction.docs[1]["@rid"] = "#" + userClusterId + ":-3";
        transaction.docs[2]["@rid"] = "#" + linkClusterId + ":-4";
        transaction.docs[2].link_to_first = transaction.docs[0]["@rid"];
        transaction.docs[2].link_to_second = transaction.docs[1]["@rid"];

        db.commit(transaction, callback);
    },
    function(result, callback) {

        assert.equal(3, result.numberOfRecordsCreated);
        assert.equal(8, result.recordsCreated[0].fromClusterId);
        assert.equal(-3, result.recordsCreated[0].fromClusterPosition);
        assert.equal(8, result.recordsCreated[0].toClusterId);
        assert.equal(1, result.recordsCreated[0].toClusterPosition);
        assert.equal(8, result.recordsCreated[1].fromClusterId);
        assert.equal(-2, result.recordsCreated[1].fromClusterPosition);
        assert.equal(8, result.recordsCreated[1].toClusterId);
        assert.equal(0, result.recordsCreated[1].toClusterPosition);
        assert.equal(9, result.recordsCreated[2].fromClusterId);
        assert.equal(-4, result.recordsCreated[2].fromClusterPosition);
        assert.equal(9, result.recordsCreated[2].toClusterId);
        assert.equal(0, result.recordsCreated[2].toClusterPosition);

        callback();
        unprepareDatabase(callback);
    },
    function() {
        db.close();
    }

], function(err) {
    if (err) db.rollback(transaction);

    db.close()
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
    db.dropClass("user", function(err) {
        if (err) return callback(err);

        db.dropClass("link", callback);
    });
}