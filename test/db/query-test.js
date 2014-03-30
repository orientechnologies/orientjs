var Query = require('../../lib/db/query');

describe("Database API - Query", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_query')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_query')
    .then(done, done)
    .done();
  });

  beforeEach(function () {
    this.query = new Query(this.db);
  });

  describe('Query::one()', function () {
    it ('should return one record', function (done) {
      this.query.select().from('OUser').limit(1).one()
      .then(function (user) {
        Array.isArray(user).should.be.false;
        user.should.have.property('name');
        done();
      }, done).done();
    });
    it ('should return one record with parameters', function (done) {
      this.query.select().from('OUser').where('name = :name').limit(1).one({name: 'reader'})
      .then(function (user) {
        Array.isArray(user).should.be.false;
        user.should.have.property('name');
        user.name.should.equal('reader');
        done();
      }, done).done();
    });
  });
  describe('Query::all()', function () {
    it ('should return all the records', function (done) {
      this.query.select().from('OUser').limit(2).all()
      .then(function (users) {
        Array.isArray(users).should.be.true;
        users.length.should.equal(2);
        done();
      }, done).done();
    });
    it ('should return all the records with parameters', function (done) {
      this.query.select().from('OUser').where('name = :name').all({name: 'reader'})
      .then(function (users) {
        Array.isArray(users).should.be.true;
        users.length.should.equal(1);
        users[0].should.have.property('name');
        users[0].name.should.equal('reader');
        done();
      }, done).done();
    });
  });
  describe('Query::scalar()', function () {
    it ('should return the scalar result', function (done) {
      this.query.select('count(*)').from('OUser').scalar()
      .then(function (response) {
        response.should.equal(3);
        done();
      }, done).done();
    });
    it ('should return the scalar result, even when many columns are selected', function (done) {
      this.query.select('count(*), max(count(*))').from('OUser').scalar()
      .then(function (response) {
        response.should.equal(3);
        done();
      }, done).done();
    });
    it ('should return the scalar result with parameters', function (done) {
      this.query.select('name').from('OUser').where('name = :name').scalar({name: 'reader'})
      .then(function (name) {
        name.should.equal('reader');
        done();
      }, done).done();
    });
  });

  describe('Db::select()', function () {
    it('should select a user', function (done) {
      this.db.select().from('OUser').where({name: 'reader'}).one()
      .then(function (user) {
        user.name.should.equal('reader');
        done();
      }, done).done();
    });
  });
  describe('Db::traverse()', function () {
    it('should traverse a user', function (done) {
      this.db.traverse().from('OUser').where({name: 'reader'}).all()
      .then(function (rows) {
        Array.isArray(rows).should.be.true;
        rows.length.should.be.above(1);
        done();
      }, done).done();
    });
  });

  describe('Db::insert()', function () {
    it('should insert a user', function (done) {
      this.db.insert().into('OUser').set({name: 'test', password: 'testpasswordgoeshere', status: 'ACTIVE'}).one()
      .then(function (user) {
        user.name.should.equal('test');
        done();
      }, done).done();
    });
  });
  describe('Db::update()', function () {
    it('should update a user', function (done) {
      this.db.update('OUser').set({foo: 'bar'}).where({name: 'reader'}).limit(1).scalar()
      .then(function (count) {
        count.should.eql(1);
        done();
      }, done).done();
    });
  });
});