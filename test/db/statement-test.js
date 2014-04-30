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
    it('should let a variable equal a subexpression', function () {
      var sub = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'});
      this.statement
      .let('names', sub)
      .buildStatement()
      .should
      .equal('LET names = SELECT name FROM OUser WHERE status = "ACTIVE"');
    });
    it('should let a variable equal a subexpression, more than once', function () {
      var sub1 = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'}),
          sub2 = (new Statement(this.db)).select('status').from('OUser');
      this.statement
      .let('names', sub1)
      .let('statuses', sub2)
      .buildStatement()
      .should
      .equal('LET names = SELECT name FROM OUser WHERE status = "ACTIVE"\nLET statuses = SELECT status FROM OUser');
    });
    it('should let a variable equal a subexpression, more than once, using locks', function () {
      var sub1 = (new Statement(this.db)).select('name').from('OUser').where({status: 'ACTIVE'}),
          sub2 = (new Statement(this.db)).select('status').from('OUser').lock('record');
      this.statement
      .let('names', sub1)
      .let('statuses', sub2)
      .buildStatement()
      .should
      .equal('LET names = SELECT name FROM OUser WHERE status = "ACTIVE"\nLET statuses = SELECT status FROM OUser LOCK record');
    });
  });

  describe('Statement::commit()', function () {
    it('should generate an empty transaction', function () {
      this.statement
      .commit()
      .buildStatement()
      .should
      .equal('BEGIN\n COMMIT \n');
    });
    it('should generate an empty transaction, with retries', function () {
      this.statement
      .commit(100)
      .buildStatement()
      .should
      .equal('BEGIN\n COMMIT RETRY 100\n');
    });
    it('should generate an update transaction', function () {
      this.statement
      .update('OUser')
      .set({name: 'name'})
      .commit()
      .toString()
      .should
      .equal('BEGIN\n UPDATE OUser SET name = "name" COMMIT \n');
    });
    it('should generate an update transaction, with retries', function () {
      this.statement
      .update('OUser')
      .set({name: 'name'})
      .commit(100)
      .toString()
      .should
      .equal('BEGIN\n UPDATE OUser SET name = "name" COMMIT RETRY 100\n');
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
    it('should select from a subexpression', function () {
      this.statement.select().from('SELECT * FROM OUser');
      this.statement.buildStatement().should.equal('SELECT * FROM (SELECT * FROM OUser)');
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

  describe('Statement::lock()', function () {
    it('should lock a record', function () {
      this.statement.update('OUser').lock('record');
      this.statement.buildStatement().should.equal('UPDATE OUser LOCK record');
    });
    it('should lock a record with an expression', function () {
      this.statement.update('OUser').where('1=1').lock('record');
      this.statement.buildStatement().should.equal('UPDATE OUser WHERE 1=1 LOCK record');
    });
  })
});