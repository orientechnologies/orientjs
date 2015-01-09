var Promise = require('bluebird');

describe.only("Bug #186: resolveReferences fail with duplicates present", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_186')
    .bind(this)
    .then(function () {
      return Promise.map([
        'create class Person extends V',
        'create class Restaurant extends V',
        'create class Eat extends E',

        'create vertex Person set name = "Luca"',
        'create vertex Person set name = "Heisenberg"',
        'create vertex Restaurant set name = "Dante", type = "Pizza"',
        'create edge Eat from (select from Person where name = "Luca") to (select from Restaurant where name = "Dante") SET someProperty="something"',
        'create edge Eat from (select from Person where name = "Heisenberg") to (select from Restaurant where name = "Dante") SET someProperty="something"',
      ], this.db.query.bind(this.db));
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_186');
  });

  describe('Query a graph with fetchplan', function () {

    it('should not return duplicates', function (done) {
      // OrientBD returns duplicates: #13:0 and #13:1 (edges)
      this.db.exec('select from Person', { fetchPlan: 'out_Eat:1 out_Eat.in:2' }).then(function (resultset) {
        //console.log('results: ' + require('util').inspect(resultset.results) + '\n');
        
        var seen = {};
        
        try {
          resultset.results.forEach(function(record){
            var rid = '#' + record.content.cluster + ':' + record.content.position;
            seen.should.not.have.property(rid);
            seen[rid] = record.content;
          });
          done();
        }
        catch (err) {
          done(err);
        }

      });
    });
    
  });
});
