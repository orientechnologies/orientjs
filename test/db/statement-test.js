var Statement = require('../../lib/db/statement');

describe("Database API - Statement", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_statement')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_statement')
    .then(done, done)
    .done();
  });

  beforeEach(function () {
    this.statement = new Statement(this.db);
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
});