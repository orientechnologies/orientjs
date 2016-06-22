var Statement = require('../../lib/db/statement');

describe("Database API - Statement", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_statement');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_statement');
  });

  beforeEach(function () {
    this.statement = new Statement(this.db);
  });

  describe('Statement::let()', function () {

    it('should let a variable in a select() query', function () {
      this.statement
      .select('$thing')
      .from('OUser')
      .let('thing', '$current.thing')
      .where('1=1')
      .buildStatement()
      .should
      .equal('SELECT $thing FROM OUser LET thing = $current.thing WHERE 1=1');
    });

    it('should let a variable equal a subexpression', function () {
      var sub = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'});
      this.statement
      .let('names', sub)
      .buildStatement()
      .should
      .equal('LET names = (SELECT name FROM OUser WHERE status = "ACTIVE")');
    });
    it('should let a variable equal a subexpression, more than once', function () {
      var sub1 = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'}),
          sub2 = (new Statement(this.db)).select('status').from('OUser');
      this.statement
      .let('names', sub1)
      .let('statuses', sub2)
      .buildStatement()
      .should
      .equal('LET names = (SELECT name FROM OUser WHERE status = "ACTIVE"),statuses = (SELECT status FROM OUser)');
    });
    it('should let a variable equal a subexpression, more than once, using locks', function () {
      var sub1 = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'}),
          sub2 = (new Statement(this.db)).select('status').from('OUser').lock('record');
      this.statement
      .let('names', sub1)
      .let('statuses', sub2)
      .buildStatement()
      .should
      .equal('LET names = (SELECT name FROM OUser WHERE status = "ACTIVE"),statuses = (SELECT status FROM OUser LOCK record)');
    });

    it('should allow RIDs in LET expressions', function () {
      var rec1 = {
        '@rid': new LIB.RID({
          cluster: 23,
          position: 1234567
        })
      };
      var rec2 = {
        '@rid': new LIB.RID({
          cluster: 23,
          position: 98765432
        })
      };
      this.statement
      .let('foo', function (statement) {
        return statement.select().from('Foo');
      })
      .let('edge', function (statement) {
        return statement
        .create('edge', 'E')
        .from('$foo')
        .to(rec1['@rid']);
      })
      .let('updated', function (statement) {
        return statement.update(rec2['@rid']).set({foo: 'bar'});
      })
      .commit()
      .return('$edge')
      .buildStatement()
      .should.equal('BEGIN\n\
 LET foo = SELECT * FROM Foo\n\
 LET edge = CREATE edge E FROM $foo TO #23:1234567\n\
 LET updated = UPDATE #23:98765432 SET foo = "bar"\n\
 \n\
COMMIT \n\
 RETURN $edge');
    });
  });

  describe('Statement::commit() and Statement::return()', function () {
    it('should generate an empty transaction', function () {
      this.statement
      .commit()
      .buildStatement()
      .should
      .equal('BEGIN\n \nCOMMIT \n');
    });
    it('should generate an empty transaction, with retries', function () {
      this.statement
      .commit(100)
      .buildStatement()
      .should
      .equal('BEGIN\n \nCOMMIT RETRY 100 \n');
    });
    it('should generate an update transaction', function () {
      this.statement
      .update('OUser')
      .set({name: 'name'})
      .commit()
      .toString()
      .should
      .equal('BEGIN\n UPDATE OUser SET name = "name" \nCOMMIT \n');
    });
    it('should generate an update transaction, with retries', function () {
      this.statement
      .update('OUser')
      .set({name: 'name'})
      .commit(100)
      .toString()
      .should
      .equal('BEGIN\n UPDATE OUser SET name = "name" \nCOMMIT RETRY 100 \n');
    });
    it('should generate an update transaction, with returns', function () {
      var sub = (new Statement(this.db)).update('OUser').set({name: 'name'});
      this.statement
      .let('names', sub)
      .commit()
      .return('$names')
      .toString()
      .should
      .equal('BEGIN\n LET names = UPDATE OUser SET name = "name"\n \nCOMMIT \n RETURN $names');
    });
    it('should generate an update transaction, with returns and a return clause before while', function () {
      var sub = (new Statement(this.db)).update('OUser').set({name: 'name'}).return('COUNT');
      this.statement
      .let('names', sub)
      .commit()
      .return('$names')
      .toString()
      .should
      .equal('BEGIN\n LET names = UPDATE OUser SET name = "name" RETURN COUNT\n \nCOMMIT \n RETURN $names');
    });
  });

  describe('Statement::select()', function () {
    it('should select all the columns by default', function () {
      this.statement.select();
      this.statement.buildStatement().should.equal('SELECT *');
    });
    it('should select a single column', function () {
      this.statement.select('name');
      this.statement.buildStatement().should.equal('SELECT name');
    });
    it('should select multiple columns', function () {
      this.statement.select('name', 'address');
      this.statement.buildStatement().should.equal('SELECT name, address');
    });
  });

  describe('Statement::traverse()', function () {
    it('should traverse all the edges by default', function () {
      this.statement.traverse();
      this.statement.buildStatement().should.equal('TRAVERSE *');
    });

    it('should traverse a single edge type', function () {
      this.statement.traverse('out("Thing")');
      this.statement.buildStatement().should.equal('TRAVERSE out("Thing")');
    });

    it('should traverse multiple edge types', function () {
      this.statement.traverse('in("Thing")', 'out("Thing")');
      this.statement.buildStatement().should.equal('TRAVERSE in("Thing"), out("Thing")');
    });

    it('should traverse in depth first', function () {
      this.statement.traverse().strategy('DEPTH_FIRST').from('Abc');
      this.statement.buildStatement().should.equal('TRAVERSE * FROM Abc STRATEGY DEPTH_FIRST');
    });

    it('should traverse in breadth first', function () {
      this.statement.traverse().strategy('BREADTH_FIRST').from('#23:4');
      this.statement.buildStatement().should.equal('TRAVERSE * FROM #23:4 STRATEGY BREADTH_FIRST');
    });

    it('should traverse with no strategy spec', function () {
      this.statement.traverse().strategy('XYZ');
      this.statement.buildStatement().should.equal('TRAVERSE *');
    });

    it('should traverse in breadth first and with limit', function () {
      this.statement.traverse().strategy('BREADTH_FIRST').limit(2).from('Xyz');
      this.statement.buildStatement().should.equal('TRAVERSE * FROM Xyz LIMIT 2 STRATEGY BREADTH_FIRST');
    });
  });

  describe('Statement::while()', function () {
    it('should add a while clause to traverses', function () {
      this.statement.traverse().from('OUser').while('$depth < 1');
      this.statement.buildStatement().should.equal("TRAVERSE * FROM OUser WHILE $depth < 1");
    });

    it('should add multiple while clauses to traverses', function () {
      this.statement.traverse().from('OUser').while('$depth < 1').and('1=1');
      this.statement.buildStatement().should.equal("TRAVERSE * FROM OUser WHILE $depth < 1 AND 1=1");
    });
  });

  describe('Statement::insert()', function () {
    it('should insert a record', function () {
      this.statement.insert().into('OUser').set({foo: 'bar', greeting: 'hello world'});
      this.statement.buildStatement().should.equal('INSERT INTO OUser SET foo = :paramfoo0, greeting = :paramgreeting1');
    });
  });

  describe('Statement::update()', function () {
    it('should update a record', function () {
      this.statement.update('#1:1').set({foo: 'bar', greeting: 'hello world'});
      this.statement.buildStatement().should.equal('UPDATE #1:1 SET foo = :paramfoo0, greeting = :paramgreeting1');
    });

    it('should update a record with a nested statement', function () {
      this.statement.update('#1:1').set({
        foo: function (s) {
          s.select().from('OUser');
        }
      });
      this.statement.buildStatement().should.equal('UPDATE #1:1 SET foo = (SELECT * FROM OUser)');
    });
  });

  describe('Statement::delete()', function () {
    it('should delete a record', function () {
      this.statement.delete().from('OUser').where({foo: 'bar', greeting: 'hello world'});
      this.statement.buildStatement().should.equal('DELETE FROM OUser WHERE (foo = :paramfoo0 AND greeting = :paramgreeting1)');
    });

    it('should delete an edge', function () {
      this.statement.delete('EDGE', 'foo').from(LIB.RID('#1:23')).to(LIB.RID('#4:56'));
      this.statement.buildStatement().should.equal('DELETE EDGE foo FROM #1:23 TO #4:56');
    });
  });

  describe('Statement::from()', function () {
    it('should select from a class', function () {
      this.statement.select().from('OUser');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser');
    });
    it('should select from a record id', function () {
      this.statement.select().from(new LIB.RID('#4:4'));
      this.statement.buildStatement().should.equal('SELECT * FROM #4:4');
    });
    it('should select from a subexpression with parentheses', function () {
      this.statement.select().from('(SELECT * FROM OUser)');
      this.statement.buildStatement().should.equal('SELECT * FROM (SELECT * FROM OUser)');
    });
    it('should select from a subexpression without parentheses', function () {
      this.statement.select().from('SELECT * FROM OUser');
      this.statement.buildStatement().should.equal('SELECT * FROM (SELECT * FROM OUser)');
    });
    it('should select from a subquery', function () {
      this.statement.select().from((new Statement(this.db).select().from('OUser')));
      this.statement.buildStatement().should.equal('SELECT * FROM (SELECT * FROM OUser)');
    });
    it('should select from a subquery, using a function', function () {
      this.statement.select().from(function (s) {
        s.select().from('OUser');
      });
      this.statement.buildStatement().should.equal('SELECT * FROM (SELECT * FROM OUser)');
    });
    it('should select from an array of rids', function () {
      this.statement.select().from([new LIB.RID('#4:0'), new LIB.RID('#4:1'), new LIB.RID('#4:2')]);
      this.statement.buildStatement().should.equal('SELECT * FROM [#4:0,#4:1,#4:2]');
    });
  });

  describe('Statement::to()', function () {
    it('should create an edge', function () {
      this.statement.create('EDGE', 'E').from('#5:0').to('#5:1');
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #5:0 TO #5:1');
    });
    it('should create an edge from a record id to a record id', function () {
      this.statement.create('EDGE', 'E').from(LIB.RID('#5:0')).to(LIB.RID('#22:310540'));
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #5:0 TO #22:310540');
    });
    it('should create an edge using a subexpression with parentheses', function () {
      this.statement.create('EDGE', 'E').to('(SELECT * FROM OUser)').from(LIB.RID('#1:23'));
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #1:23 TO (SELECT * FROM OUser)');
    });
    it('should create an edge using a subexpression without parentheses', function () {
      this.statement.create('EDGE', 'E').to('SELECT * FROM OUser').from(LIB.RID('#1:23'));
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #1:23 TO (SELECT * FROM OUser)');
    });
    it('should create an edge using a subquery', function () {
      this.statement.create('EDGE', 'E').to((new Statement(this.db).select().from('OUser'))).from(LIB.RID('#1:23'));
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #1:23 TO (SELECT * FROM OUser)');
    });
  });

  describe('Statement::retry()', function () {
    it('should create an edge with retry', function () {
      this.statement.create('EDGE', 'E').from('#5:0').to('#5:1').retry(5);
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #5:0 TO #5:1 RETRY 5');
    });
  });

  describe('Statement::wait()', function () {
    it('should create an edge with retry and wait', function () {
      this.statement.create('EDGE', 'E').from('#5:0').to('#5:1').retry(5).wait(100);
      this.statement.buildStatement().should.equal('CREATE EDGE E FROM #5:0 TO #5:1 RETRY 5 WAIT 100');
    });
  });

  describe('Statement::return()', function () {
    it('should build a return clause', function () {
      this.statement.update('#1:1').set({foo: 'bar', greeting: 'hello world'}).return('AFTER');
      this.statement.buildStatement().should.equal('UPDATE #1:1 SET foo = :paramfoo0, greeting = :paramgreeting1 RETURN AFTER');
    });
    it('should build a return clause with object parameters', function () {
      this.statement.update('#1:1').set({foo: 'bar', greeting: 'hello world'}).return({rid: '@rid'});
      this.statement.buildStatement().should.equal('UPDATE #1:1 SET foo = :paramfoo0, greeting = :paramgreeting1 RETURN {"rid":@rid}');
    });
    it('should build a return clause with array parameters', function () {
      this.statement.update('#1:1').set({foo: 'bar', greeting: 'hello world'}).return(['@rid', '@class']);
      this.statement.buildStatement().should.equal('UPDATE #1:1 SET foo = :paramfoo0, greeting = :paramgreeting1 RETURN [@rid,@class]');
    });
    it('should build a return clause before the where clause', function () {
      this.statement.delete().from('OUser').return('BEFORE').where({foo: 'bar', greeting: 'hello world'});
      this.statement.buildStatement().should.equal('DELETE FROM OUser RETURN BEFORE WHERE (foo = :paramfoo0 AND greeting = :paramgreeting1)');
    });
    it('should build a return clause after the insert query', function () {
      this.statement.insert().into('OUser').set({foo: 'bar', greeting: 'hello world'}).return('AFTER');
      this.statement.buildStatement().should.equal('INSERT INTO OUser SET foo = :paramfoo0, greeting = :paramgreeting1 RETURN AFTER');
    });
  });

  describe('Statement::skip() and Statement::limit()', function () {
    it('should build a statement with a skip clause', function () {
      this.statement.select().from('OUser').skip(2);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser SKIP 2');
    });

    it('should build a statement with a limit clause', function () {
      this.statement.select().from('OUser').limit(2);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser LIMIT 2');
    });

    it('should build a statement with skip and limit clauses', function () {
      this.statement.select().from('OUser').skip(1).limit(2);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser LIMIT 2 SKIP 1');
    });
  });

  describe('Statement::where(), Statement::and(), Statement::or()', function () {
    it('should build a where clause with an expression', function () {
      this.statement.select().from('OUser').where('1=1');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE 1=1');
    });
    it('should build a where clause with a map of values', function () {
      this.statement.select().from('OUser').where({
        name: 'root',
        foo: 'bar'
      });
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE (name = :paramname0 AND foo = :paramfoo1)');
    });
    it('should generate IS NULL in a where clause', function () {
      this.statement.select().from('OUser').where({
        name: 'root',
        foo: null
      });
      this.statement.toString().should.equal('SELECT * FROM OUser WHERE (name = "root" AND foo IS NULL)');
    });
    it('should build a chained where clause', function () {
      this.statement.select().from('OUser').where('1=1').where('2=2');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE 1=1 AND 2=2');
    });
    it('should build a where clause with an AND expression', function () {
      this.statement.select().from('OUser').where('1=1').and('2=2');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE 1=1 AND 2=2');
    });
    it('should build a where clause with an OR expression', function () {
      this.statement.select().from('OUser').where('1=1').or('2=2');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE (1=1) OR 2=2');
    });
    it('should build a where clause with a chained OR expression', function () {
      this.statement.select().from('OUser').where('1=1').or('2=2').or('3=3').or('4=4');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE (1=1) OR 2=2 OR 3=3 OR 4=4');
    });
    it('should build a complicated, chained where clause', function () {
      this.statement.select().from('OUser').where('1=1').or('2=2').or('3=3').or('4=4').and('5=5');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE ((1=1) OR 2=2 OR 3=3 OR 4=4) AND 5=5');
    });
  });

  describe('Statement::containsText()', function () {
    it('should build a where clause with a map of values', function () {
      this.statement.select().from('OUser').containsText({
        name: 'root',
        foo: 'bar'
      });
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE (name CONTAINSTEXT :paramname0 AND foo CONTAINSTEXT :paramfoo1)');
    });
  });

  describe('Statement::lock()', function () {
    it('should lock a record', function () {
      this.statement.update('OUser').lock('record');
      this.statement.buildStatement().should.equal('UPDATE OUser LOCK record');
    });
    it('should lock a record with an expression', function () {
      this.statement.update('OUser').where('1=1').lock('record');
      this.statement.buildStatement().should.equal('UPDATE OUser WHERE 1=1 LOCK record');
    });
  });

  describe('Statement::upsert()', function () {
    it('should upsert a record', function () {
      this.statement.update('OUser').set("foo = 'bar'").upsert().where('1 = 1');
      this.statement.buildStatement().should.equal("UPDATE OUser SET foo = 'bar' UPSERT WHERE 1 = 1");
    });
    it('should upsert a record, with a where clause', function () {
      this.statement.update('OUser').set("foo = 'bar'").upsert('1 = 1');
      this.statement.buildStatement().should.equal("UPDATE OUser SET foo = 'bar' UPSERT WHERE 1 = 1");
    });
  });


  describe('Statement::lucene()', function () {
    it('should accept a string query', function () {
      this.statement.select().from('OUser').lucene('name', '(name:"admin")');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE name LUCENE "(name:\\"admin\\")"');
    });

    it('should accept a naked string query', function () {
      this.statement.select().from('OUser').lucene('name', 'admin');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE name LUCENE "admin"');
    });

    it('should accept a query object', function () {
      this.statement.select().from('OUser').lucene({
        name: 'admin',
        status: 'ACTIVE'
      });
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE name LUCENE "admin" AND status LUCENE "ACTIVE"');
    });

    it('should accept multiple parameters', function () {
      this.statement.select().from('OUser').lucene('name', 'status', '(name:"admin" AND status:"ACTIVE")');
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [name,status] LUCENE "(name:\\"admin\\" AND status:\\"ACTIVE\\")"');
    });
  });


  describe('Statement::near()', function () {
    it('should accept plain values', function () {
      this.statement.select().from('OUser').near('latitude', 'longitude', 1, 2);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [latitude,longitude] NEAR [1,2]');
    });
    it('should accept plain values with a max distance', function () {
      this.statement.select().from('OUser').near('latitude', 'longitude', 1, 2, 100);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [latitude,longitude,$spatial] NEAR [1,2,{"maxDistance":100}]');
    });
    it('should accept an object of values', function () {
      this.statement.select().from('OUser').near({latitude: 1, longitude: 2});
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [latitude,longitude] NEAR [1,2]');
    });
    it('should accept an object of values, with a max distance', function () {
      this.statement.select().from('OUser').near({latitude: 1, longitude: 2}, 100);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [latitude,longitude,$spatial] NEAR [1,2,{"maxDistance":100}]');
    });
  });

  describe('Statement::within()', function () {
    it('should build a within query', function () {
      this.statement.select().from('OUser').within('latitude', 'longitude', [[1, 2], [3, 4]]);
      this.statement.buildStatement().should.equal('SELECT * FROM OUser WHERE [latitude,longitude] WITHIN [[1,2],[3,4]]');
    });
  });

  describe('Statement::increment()', function () {
    it('should increment a field using the default value', function () {
      this.statement.update('#1:1').increment('foo');
      this.statement.toString().should.equal('UPDATE #1:1 INCREMENT foo = 1');
    });

    it('should increment a field using the specified positive value', function () {
      this.statement.update('#1:1').increment('foo', 100);
      this.statement.toString().should.equal('UPDATE #1:1 INCREMENT foo = 100');
    });




    it('should increment a field using the specified negative value', function () {
      this.statement.update('#1:1').increment('foo', -100);
      this.statement.toString().should.equal('UPDATE #1:1 INCREMENT foo = -100');
    });

    it('should increment a field using the specified 0 value', function () {
      this.statement.update('#1:1').increment('foo', 0);
      this.statement.toString().should.equal('UPDATE #1:1 INCREMENT foo = 0');
    });
  });

  describe('Statement::add()', function () {
    it('should add a string value to a property', function () {
      this.statement.update('#1:1').add('foo', 'bar');
      this.statement.toString().should.equal('UPDATE #1:1 ADD foo = "bar"');
    });

    it('should add a numerical value to a property', function () {
      this.statement.update('#1:1').add('foo', 123);
      this.statement.toString().should.equal('UPDATE #1:1 ADD foo = 123');
    });

    it('should add multiple values to a property', function () {
      this.statement.update('#1:1').add('foo', 123, 'bar');
      this.statement.toString().should.equal('UPDATE #1:1 ADD foo = 123, foo = "bar"');
    });
  });

  describe('Statement::remove()', function () {
    it('should remove a string value from a property', function () {
      this.statement.update('#1:1').remove('foo', 'bar');
      this.statement.toString().should.equal('UPDATE #1:1 REMOVE foo = "bar"');
    });

    it('should remove a numerical value from a property', function () {
      this.statement.update('#1:1').remove('foo', 123);
      this.statement.toString().should.equal('UPDATE #1:1 REMOVE foo = 123');
    });

    it('should remove multiple values from a property', function () {
      this.statement.update('#1:1').remove('foo', 123, 'bar');
      this.statement.toString().should.equal('UPDATE #1:1 REMOVE foo = 123, foo = "bar"');
    });
  });

  describe('Statement::put()', function () {
    it('should build a put query', function () {
      this.statement.update('#1:1')
      .put('fooMap', {
        foo: 'fooVal',
        greeting: 'hello world'
      })
      .put('barMap', {
        bar: 'barVal',
        name: 'mario'
      });
      this.statement.buildStatement().should.equal('UPDATE #1:1 PUT ' +
        'fooMap = "foo", :paramfooMapfoo0, ' +
        'fooMap = "greeting", :paramfooMapgreeting1, ' +
        'barMap = "bar", :parambarMapbar2, ' +
        'barMap = "name", :parambarMapname3');
    });
  });
});
