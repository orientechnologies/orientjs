var Promise = require('bluebird');

describe("Bug #186: resolveReferences fail with duplicates present", function () {
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
    function Person (data) {
      if (!(this instanceof Person)) {
        return new Person(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }

    function Restaurant (data) {
      if (!(this instanceof Restaurant)) {
        return new Restaurant(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }

    function Eat (data) {
      if (!(this instanceof Eat)) {
        return new Eat(data);
      }
      var keys = Object.keys(data),
          length = keys.length,
          key, i;
      for (i = 0; i < length; i++) {
        key = keys[i];
        this[key] = data[key];
      }
    }

    function testPerson(person, verbose){
      (person.name === 'Luca' || person.name === 'Heisenberg').should.be.ok;
      person.should.have.property('out_Eat');
      var edge = person.out_Eat;
      if(edge instanceof LIB.Bag){
        edge = edge.all()[0];
      }
      else if(edge instanceof Array){
        edge = edge[0];  // OrientDB 2.0 @this.toJSON() returns Array
      }
      if(verbose){
        console.log('edge (' + person.name + '): ' + require('util').inspect(edge, {depth: 3}));
      }
      edge.should.have.property('in');
      edge.in.should.have.property('name');  // breaks for depth 2: no name, as 'in' is a RID
      edge.in.name.should.equal('Dante');
    }

    before(function () {
      this.db.registerTransformer('Person', Person);
      this.db.registerTransformer('Restaurant', Restaurant);
      this.db.registerTransformer('Eat', Eat);
    });

    // Control tests
    it('should return linked vertices when using @this.toJSON(fetchPlan) with depth 2', function () {
      return this.db.query('SELECT @this.toJSON("fetchPlan:out_Eat:1 out_Eat.in:2") from Person').all()
      .then(function (result) {
        var people = [];
        people[0] = JSON.parse(result[0].this);
        people[1] = JSON.parse(result[1].this);
        //console.log('people: ' + require('util').inspect(people, {depth: 3}));
        people.length.should.be.equal(2);
        people.forEach(function (person) {
          testPerson(person);
        });
      });
    });

    it('should return linked vertices when using .fetch() with depth 1', function () {
      return this.db.select().from('Person').fetch('out_Eat:1 out_Eat.in:1').all()
      .then(function (people) {
        //console.log('people: ' + require('util').inspect(people, {depth: 3}));
        people.length.should.be.equal(2);
        people.forEach(function (person) {
          testPerson(person);
        });
      });
    });

    it('should return one linked vertex when using .fetch() with depth 2', function () {
      return this.db.select().from('Person')
        .limit(1)
        .fetch('out_Eat:1 out_Eat.in:2').one()
        .then(function (person) {
          //console.log('\nperson: ' + require('util').inspect(person, {depth: 3}));
          testPerson(person);
        });
    });

    // Relevant test
    it('should return linked vertices when using .fetch() with depth 2', function () {
      // OrientBD returns duplicates: #13:0 and #13:1 (edges)
      // this.db.exec('select from Person', { fetchPlan: 'out_Eat:1 out_Eat.in:2' }).then(function (resultset) {
        // console.log('results: ' + require('util').inspect(resultset.results) + '\n');
      // });

      return this.db.select().from('Person').fetch('out_Eat:1 out_Eat.in:2').all()
      .then(function (people) {
        //console.log('\npeople: ' + require('util').inspect(people, {depth: 4}));
        people.length.should.be.equal(2);
        people.forEach(function (person) {
          testPerson(person, false);
        });
      });
    });

  });
});
