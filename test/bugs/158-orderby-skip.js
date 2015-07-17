var Promise = require('bluebird');

//@dmarcelino test case

describe("Bug #158: order by with skip returning 0 results", function () {
    before(function () {
        return CREATE_TEST_DB(this, 'testdb_bug_158')
            .bind(this)
            .then(function () {
                return Promise.map([
                    'CREATE CLASS customerTable EXTENDS V',
                    'CREATE PROPERTY customerTable.name STRING',

                    'INSERT INTO customerTable SET name = "hasmany find pop"',
                    'INSERT INTO customerTable SET name = "hasmany find pop"',
                ], this.db.query.bind(this.db));
            });
    });
    after(function () {
        return DELETE_TEST_DB('testdb_bug_158');
    });
    // Control tests
    it('should return two records when using ORDER BY', function () {
        return this.db.query('SELECT name, @rid FROM customerTable WHERE name.toLowerCase() = "hasmany find pop" ORDER BY @rid ASC')
            .then(function (results) {
                results.length.should.equal(2);
                results[0].name.should.equal('hasmany find pop');
            });
    });
    it('should return one record when using SKIP', function () {
        return this.db.query('SELECT name, @rid FROM customerTable WHERE name.toLowerCase() = "hasmany find pop" SKIP 1')
            .then(function (results) {
                results.length.should.equal(1);
                results[0].name.should.equal('hasmany find pop');
            });
    });
    // The relevant test case
    it('should return one record when using ORDER BY and SKIP', function () {
        return this.db.query('SELECT name, @rid FROM customerTable WHERE name.toLowerCase() = "hasmany find pop" ORDER BY @rid ASC SKIP 1')
            .then(function (results) {
                results.length.should.equal(1);
                results[0].name.should.equal('hasmany find pop');
            });
    });
    // Workaround as suggested by phpnode
    it('should return one record when using ORDER BY and SKIP and LIMIT', function () {
        return this.db.query('SELECT name, @rid FROM customerTable WHERE name.toLowerCase() = "hasmany find pop" ORDER BY @rid ASC SKIP 1 LIMIT 2147483646')
            .then(function (results) {
                results.length.should.equal(1);
                results[0].name.should.equal('hasmany find pop');
            });
    });
});