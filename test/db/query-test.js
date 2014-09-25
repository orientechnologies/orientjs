var Query = require('../../lib/db/query');

describe("Database API - Query", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_query');

  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_query');

  });

  beforeEach(function () {
    this.query = new Query(this.db);
  });

  describe('Query::one()', function () {
    it('should return one record', function () {
      return this.query.select().from('OUser').limit(1).one()
      .then(function (user) {
        Array.isArray(user).should.be.false;
        user.should.have.property('name');
      });
    });
    it('should return one record with parameters', function () {
      return this.query.select().from('OUser').where('name = :name').limit(1).one({name: 'reader'})
      .then(function (user) {
        Array.isArray(user).should.be.false;
        user.should.have.property('name');
        user.name.should.equal('reader');
      });
    });
  });
  describe('Query::all()', function () {
    it('should return all the records', function () {
      return this.query.select().from('OUser').limit(2).all()
      .then(function (users) {
        Array.isArray(users).should.be.true;
        users.length.should.equal(2);
      });
    });
    it('should return all the records with parameters', function () {
      return this.query.select().from('OUser').where('name = :name').all({name: 'reader'})
      .then(function (users) {
        Array.isArray(users).should.be.true;
        users.length.should.equal(1);
        users[0].should.have.property('name');
        users[0].name.should.equal('reader');
      });
    });
  });
  describe('Query::scalar()', function () {
    it('should return the scalar result', function () {
      return this.query.select('count(*)').from('OUser').scalar()
      .then(function (response) {
        response.should.equal(3);
      });
    });
    it('should return the scalar result, even when many columns are selected', function () {
      return this.query.select('count(*), max(count(*))').from('OUser').scalar()
      .then(function (response) {
        response.should.equal(3);
      });
    });
    it('should return the scalar result with parameters', function () {
      return this.query.select('name').from('OUser').where('name = :name').scalar({name: 'reader'})
      .then(function (name) {
        name.should.equal('reader');
      });
    });
  });

  describe('Query::transform()', function () {
    it('should apply a single transform function', function () {
      return this.query
      .select()
      .from('OUser')
      .transform(function (user) {
        user.wat = true;
        return user;
      })
      .limit(1)
      .one()
      .then(function (user) {
        user.wat.should.be.true;
      });
    });

    it('should transform values according to an object', function () {
      return this.query
      .select()
      .from('OUser')
      .transform({
        '@rid': String,
        name: function (name) {
          return name.toUpperCase();
        }
      })
      .where({name: 'reader'})
      .limit(1)
      .one()
      .then(function (user) {
        (typeof user['@rid']).should.equal('string');
        user.name.should.equal('READER');
      });
    });

    it('should apply multiple transforms in order', function () {
      return this.query
      .select()
      .from('OUser')
      .transform(function (user) {
        user.wat = true;
        return user;
      })
      .transform({
        '@rid': String,
        name: function (name) {
          return name.toUpperCase();
        }
      })
      .where({name: 'reader'})
      .limit(1)
      .one()
      .then(function (user) {
        user.wat.should.be.true;
        (typeof user['@rid']).should.equal('string');
        user.name.should.equal('READER');
      });
    });
  });

  describe('Query::column()', function () {
    it('should return a specific column', function () {
      return this.query
      .select('name')
      .from('OUser')
      .column('name')
      .all()
      .then(function (names) {
        names.length.should.be.above(2);
        (typeof names[0]).should.equal('string');
        (typeof names[1]).should.equal('string');
        (typeof names[2]).should.equal('string');
      });
    });

    it('should return two columns', function () {
      return this.query
      .select('name', 'status')
      .from('OUser')
      .column('name', 'status')
      .all()
      .then(function (results) {
        results.length.should.be.above(2);
        results.map(function (result) {
          Object.keys(result).length.should.equal(2);
          result.should.have.property('name');
          result.should.have.property('status');
        });
      });
    });

    it('should alias columns to different names', function () {
      return this.query
      .select()
      .from('OUser')
      .column({
        name: 'nom',
        status: 'stat'
      })
      .all()
      .then(function (results) {
        results.length.should.be.above(2);
        results.map(function (result) {
          Object.keys(result).length.should.equal(2);
          result.should.have.property('nom');
          result.should.have.property('stat');
        });
      });
    });
  });

  describe('Query::defaults()', function () {
    it('should apply the given default values', function () {
      return this.query
      .select()
      .from('OUser')
      .defaults({
        name: 'NEVER_MATCHES',
        nonsense: true
      })
      .where({name: 'reader'})
      .limit(1)
      .one()
      .then(function (user) {
        user.name.should.equal('reader');
        user.nonsense.should.be.true;
      });
    });

    it('should apply the given default values to many records', function () {
      return this.query
      .select()
      .from('OUser')
      .defaults({
        name: 'NEVER_MATCHES',
        nonsense: true
      })
      .all()
      .then(function (users) {
        users.length.should.be.above(0);
        users.forEach(function (user) {
          user.name.should.not.equal('NEVER_MATCHES');
          user.nonsense.should.be.true;
        });
      });
    });

    it('should apply the given default values to many records before returning a single column', function () {
      return this.query
      .select()
      .from('OUser')
      .defaults({
        name: 'NEVER_MATCHES',
        nonsense: true
      })
      .column('nonsense')
      .all()
      .then(function (names) {
        names.length.should.be.above(0);
        names.forEach(function (name) {
          name.should.not.equal('NEVER_MATCHES');
        });
      });
    });
    it('should apply the given default values to many records before returning  2 columns', function () {
      return this.query
      .select()
      .from('OUser')
      .defaults({
        name: 'NEVER_MATCHES',
        nonsense: true
      })
      .column('name', 'nonsense')
      .all()
      .then(function (users) {
        users.length.should.be.above(0);
        users.forEach(function (user) {
          user.name.should.not.equal('NEVER_MATCHES');
          user.nonsense.should.be.true;
        });
      });
    });
  });

  describe('Db::select()', function () {
    it('should select a user', function () {
      return this.db.select().from('OUser').where({name: 'reader'}).one()
      .then(function (user) {
        user.name.should.equal('reader');
      });
    });
    it('should select a user with a fetch plan', function () {
      return this.db.select().from('OUser').where({name: 'reader'}).fetch({roles: 3}).one()
      .then(function (user) {
        user.name.should.equal('reader');
        user.roles.length.should.be.above(0);
        user.roles[0]['@class'].should.equal('ORole');
      });
    });
    it('should select a user with multiple fetch plans', function () {
      return this.db.select().from('OUser').where({name: 'reader'}).fetch({roles: 3, '*': -1}).one()
      .then(function (user) {
        user.name.should.equal('reader');
        user.roles.length.should.be.above(0);
        user.roles[0]['@class'].should.equal('ORole');
      });
    });
  });
  describe('Db::traverse()', function () {
    it('should traverse a user', function () {
      return this.db.traverse().from('OUser').where({name: 'reader'}).all()
      .then(function (rows) {
        Array.isArray(rows).should.be.true;
        rows.length.should.be.above(1);
      });
    });
  });

  describe('Db::insert()', function () {
    it('should insert a user', function () {
      return this.db.insert().into('OUser').set({name: 'test', password: 'testpasswordgoeshere', status: 'ACTIVE'}).one()
      .then(function (user) {
        user.name.should.equal('test');
      });
    });
  });
  describe('Db::update()', function () {
    it('should update a user', function () {
      return this.db.update('OUser').set({foo: 'bar'}).where({name: 'reader'}).limit(1).scalar()
      .then(function (count) {
        count.should.eql(1);
      });
    });
  });
  describe('Db::query()', function() {
    it('should execute an insert query', function () {
      return this.db.query('insert into OUser (name, password, status) values (:name, :password, :status)',
        {
          params: {
            name: 'Samson',
            password: 'mypassword',
            status: 'active'
          }
        }
      ).then(function (response){
        response[0].name.should.equal('Samson');
      });
    });
    it('should exec a raw select command', function () {
      return this.db.exec('select from OUser where name=:name', {
        params: {
          name: 'Samson'
        }
      })
      .then(function (result){
        Array.isArray(result.results[0].content).should.be.true;
        result.results[0].content.length.should.be.above(0);
      });
    });
    it('should execute a script command', function () {
      return this.db.exec('123456;', {
        language: 'javascript',
        class: 's'
      })
      .then(function (response) {
        response.results.length.should.equal(1);
      });
    });
    it('should execute a select query string', function () {
      return this.db.query('select from OUser where name=:name', {
        params: {
          name: 'Samson'
        },
        limit: 1
      })
      .then(function (result){
        Array.isArray(result).should.be.true;
        result.length.should.be.above(0);
        (result[0]['@class']).should.eql('OUser');
      });
    });
    it('should execute a delete query', function () {
      return this.db.query('delete from OUser where name=:name', {
        params: {
          name: 'Samson'
        }
      }).then(function (response){
        response[0].should.eql('1');
      });
    });
  });
});