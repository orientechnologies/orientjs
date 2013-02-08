var assert = require("assert");
var _ = require("lodash");

var db = require("./test_db.js").db;

db.open(function(err, result) {

    assert(!err, "Error while opening the database: " + err);
    
    var count = 0;
    for (var idx = 0; idx < 1000; idx++) {
        db.command("SELECT FROM OUser", function() {
            count++;
        });
        db.command("CREATE CLASS OUser", function(err, results) {
            count++
            assert(err);
            if (count === 2000) {
                db.close();
            }
        });
    }
});

