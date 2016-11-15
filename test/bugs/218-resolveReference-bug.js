var Bluebird = require('bluebird');

describe("Issue #218: Duplicates sometimes with resolveReferences", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_issue_218')
      .bind(this)
      .then(function () {
        return Bluebird.all([
          this.db.class.create('Team', 'V'),
          this.db.class.create('Player', 'V'),
          this.db.class.create('TeamHasPlayer', 'E')
        ]);
      })
      .then(function(){
        return USE_ODB("testdb_issue_218").open();
      })
      .then(function (db) {
        this.db = db;
        return this.db
          .let('first', "create vertex Team set name = 'TeamA'")
          .let('second', "create vertex Player set name = 'Player1'")
          .let('third', "create vertex Player set name = 'Player2'")
          .let('edges', "create edge TeamHasPlayer from (select from Team) to (select from Player)")
          .return("$edges")
          .commit()
          .all()
          .then(function (results) {

          });
      });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_issue_218');
  });

  IF_ORIENTDB_MAJOR('2.2.0','should not return duplicate with match ', function () {
    var query = 'Match { class: Team, as: team }.out("TeamHasPlayer") {as: player} return team.name as team, player.name as player';
    return this.db.query(query).then(function (result) {
      result.length.should.eql(2);
      result[0].player.should.not.eql(result[1].player);
    });
  });
  it('should not return duplicate with select out() ', function () {
    return this.db.select('expand(out("TeamHasPlayer").include("name"))')
      .from('Team')
      .all()
      .then(function (result) {
        result.length.should.eql(2);
        result[0].name.should.not.eql(result[1].name);
      });
  });

});


