var assert = require("assert"),
    async = require("async");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

var userClusterId, linkClusterId, transaction, existingDoc, firstNewDoc, secondNewDoc, newLink;

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

        callback();
    },
    function(callback) {
        existingDoc = {
            "@class": "user",
            name: "existing user name",
            surname: "existing user surname"
        };

        db.save(existingDoc, callback);
    },
    function(_existingDoc, callback) {
        existingDoc = _existingDoc;

        assert.equal(0, existingDoc["@version"]);

        callback();
    },
    function(callback) {
        transaction = db.begin();

        assert.equal(-1, transaction.clusterPosition);
        assert.equal(0, transaction.docs.length);

        firstNewDoc = {
            "@class": "user",
            name: "first",
            surname: "first"
        };

        db.save(firstNewDoc, transaction, callback);
    },
    function(_firstNewDoc, callback) {
        firstNewDoc = _firstNewDoc;

        assert.equal(-2, transaction.clusterPosition);
        assert.equal(1, transaction.docs.length);

        firstNewDoc.name = "first doc name";
        firstNewDoc.surname = "first doc surname";

        db.save(firstNewDoc, transaction, callback);
    },
    function(_firstNewDoc, callback) {
        firstNewDoc = _firstNewDoc;

        assert.equal(-2, transaction.clusterPosition);
        assert.equal(1, transaction.docs.length);

        secondNewDoc = {
            "@class": "user",
            name: "second doc name",
            surname: "second doc surname"
        };
        db.save(secondNewDoc, transaction, callback);
    },
    function(_secondNewDoc, callback) {
        secondNewDoc = _secondNewDoc;

        assert.equal(-3, transaction.clusterPosition);
        assert.equal(2, transaction.docs.length);

        newLink = {
            "@class": "link",
            link_to_first: firstNewDoc["@rid"],
            link_to_second: secondNewDoc["@rid"]
        };

        db.save(newLink, transaction, callback);
    },
    function(_newLink, callback) {
        newLink = _newLink;

        callback();
    },
    function(callback) {
        existingDoc.name = "new " + existingDoc.name;
        existingDoc.surname = "new " + existingDoc.surname;

        db.save(existingDoc, transaction, callback);
    },
    function(_existingDoc, callback) {
        existingDoc = _existingDoc;

        callback();
    },
    function(callback) {
        assert.equal(-4, transaction.clusterPosition);
        assert.equal(4, transaction.docs.length);

        db.commit(transaction, callback);
    },
    function(result, callback) {

        assert.equal(3, result.numberOfRecordsCreated);

        result.recordsCreated.sort(function(a, b) {
            return ("" + a.fromClusterId + a.fromClusterPosition).localeCompare("" + b.fromClusterId + b.fromClusterPosition);
        });
        assert.equal(userClusterId, result.recordsCreated[0].fromClusterId);
        assert.equal(-2, result.recordsCreated[0].fromClusterPosition);
        assert.equal(userClusterId, result.recordsCreated[0].toClusterId);
        assert.equal(1, result.recordsCreated[0].toClusterPosition);
        assert.equal(userClusterId, result.recordsCreated[1].fromClusterId);
        assert.equal(-3, result.recordsCreated[1].fromClusterPosition);
        assert.equal(userClusterId, result.recordsCreated[1].toClusterId);
        assert.equal(2, result.recordsCreated[1].toClusterPosition);
        assert.equal(linkClusterId, result.recordsCreated[2].fromClusterId);
        assert.equal(-4, result.recordsCreated[2].fromClusterPosition);
        assert.equal(linkClusterId, result.recordsCreated[2].toClusterId);
        assert.equal(0, result.recordsCreated[2].toClusterPosition);

        assert.equal(1, result.numberOfRecordsUpdated);
        assert.equal(userClusterId, result.recordsUpdated[0].clusterId);
        assert.equal(0, result.recordsUpdated[0].clusterPosition);
        assert.equal(1, result.recordsUpdated[0].version);

        unprepareDatabase(callback);
    },
    function() {
        db.close();
    }
], function(err) {
    assert(!err, err);

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