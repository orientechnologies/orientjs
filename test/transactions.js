var assert = require("assert"),
    async = require("async");

var orient = require("../lib/orientdb"),
    Db = orient.Db,
    Server = orient.Server;

var serverConfig = require("../config/test/serverConfig");
var dbConfig = require("../config/test/dbConfig");

var server = new Server(serverConfig);
var db = new Db("temp", server, dbConfig);

var userClusterId, linkClusterId, transaction,
    firstExistingDoc, firstExistingDocRID, firstExistingDocVersion,
    secondExistingDoc, secondExistingDocRID,
    firstNewDoc, firstNewDocRID,
    secondNewDoc, secondNewDocRID,
    newLink, newLinkRID;

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
        firstExistingDoc = {
            "@class": "user",
            name: "first existing user name",
            surname: "first existing user surname"
        };

        db.save(firstExistingDoc, callback);
    },
    function(_firstExistingDoc, callback) {
        firstExistingDoc = _firstExistingDoc;
        firstExistingDocRID = _firstExistingDoc["@rid"];
        firstExistingDocVersion = _firstExistingDoc["@version"];

        assert.equal(0, firstExistingDoc["@version"]);

        callback();
    },
    function(callback) {
        secondExistingDoc = {
            "@class": "user",
            name: "second existing user name",
            surname: "second existing user surname"
        };

        db.save(secondExistingDoc, callback);
    },
    function(_secondExistingDoc, callback) {
        secondExistingDoc = _secondExistingDoc;
        secondExistingDocRID = _secondExistingDoc["@rid"];

        assert.equal(0, secondExistingDoc["@version"]);

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
        firstNewDocRID = _firstNewDoc["@rid"];

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
        secondNewDocRID = _secondNewDoc["@rid"];

        assert.equal(-3, transaction.clusterPosition);
        assert.equal(2, transaction.docs.length);

        newLink = {
            "@class": "link",
            link_to_first: firstNewDoc["@rid"],
            link_to_second: secondNewDoc["@rid"],
            sub_section: {
                section_name: "sub link to first doc",
                linked_doc: firstNewDoc["@rid"]
            }
        };
        
        firstNewDoc.link_to_second = secondNewDoc["@rid"];
        secondNewDoc.link_to_first = firstNewDoc["@rid"];

        db.save(newLink, transaction, callback);
    },
    function(_newLink, callback) {
        newLink = _newLink;
        newLinkRID = _newLink["@rid"];

        callback();
    },
    function(callback) {
        firstExistingDoc.name = "new " + firstExistingDoc.name;
        firstExistingDoc.surname = "new " + firstExistingDoc.surname;

        db.save(firstExistingDoc, transaction, callback);
    },
    function(_firstExistingDoc, callback) {
        firstExistingDoc = _firstExistingDoc;

        callback();
    },
    function(callback) {
        db.delete(secondExistingDoc, transaction, callback);
    },
    function(callback) {
        assert.equal(-4, transaction.clusterPosition);
        assert.equal(5, transaction.docs.length);

        db.commit(transaction, callback);
    },
    function(txResult, callback) {

        assert.equal(3, txResult.numberOfRecordsCreated);

        txResult.recordsCreated.sort(function(a, b) {
            return ("" + a.fromClusterId + a.fromClusterPosition).localeCompare("" + b.fromClusterId + b.fromClusterPosition);
        });
        assert.equal(userClusterId, txResult.recordsCreated[0].fromClusterId);
        assert.equal(-2, txResult.recordsCreated[0].fromClusterPosition);
        assert.equal(userClusterId, txResult.recordsCreated[0].toClusterId);
        assert.equal(2, txResult.recordsCreated[0].toClusterPosition);
        assert.equal(userClusterId, txResult.recordsCreated[1].fromClusterId);
        assert.equal(-3, txResult.recordsCreated[1].fromClusterPosition);
        assert.equal(userClusterId, txResult.recordsCreated[1].toClusterId);
        assert.equal(3, txResult.recordsCreated[1].toClusterPosition);
        assert.equal(linkClusterId, txResult.recordsCreated[2].fromClusterId);
        assert.equal(-4, txResult.recordsCreated[2].fromClusterPosition);
        assert.equal(linkClusterId, txResult.recordsCreated[2].toClusterId);
        assert.equal(0, txResult.recordsCreated[2].toClusterPosition);

        assert.equal(2, txResult.numberOfRecordsUpdated);

        txResult.recordsUpdated.sort(function(a, b) {
            return ("" + a.clusterId + a.clusterPosition).localeCompare("" + b.clusterId + b.clusterPosition);
        });

        assert.equal(userClusterId, txResult.recordsUpdated[0].clusterId);
        assert.equal(0, txResult.recordsUpdated[0].clusterPosition);
        assert.equal(1, txResult.recordsUpdated[0].version);
        assert.equal(userClusterId, txResult.recordsUpdated[1].clusterId);
        assert.equal(2, txResult.recordsUpdated[1].clusterPosition);
        assert.equal(1, txResult.recordsUpdated[1].version);
        
        assert.equal(firstExistingDoc["@rid"], firstExistingDocRID);
        assert.equal(firstExistingDoc["@version"], firstExistingDocVersion + 1);
        assert(firstNewDoc["@rid"] !== firstNewDocRID);
        assert.equal(firstNewDoc["@version"], 1);
        assert(secondNewDoc["@rid"] !== secondNewDoc);
        assert.equal(secondNewDoc["@version"], 0);
        assert(newLink["@rid"] !== newLinkRID);
        assert.equal(newLink["@version"], 0);
        
        assert.equal(newLink.link_to_first, firstNewDoc["@rid"]);
        assert.equal(newLink.sub_section.linked_doc, firstNewDoc["@rid"]);
        assert.equal(newLink.link_to_second, secondNewDoc["@rid"]);
        assert.equal(firstNewDoc.link_to_second, secondNewDoc["@rid"]);
        assert.equal(secondNewDoc.link_to_first, firstNewDoc["@rid"]);

        db.loadRecord(secondExistingDoc["@rid"], function(err) {
            assert(err);
        });

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