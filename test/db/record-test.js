var createdRID;

describe("Database API - Record", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_record')
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_record')
    .then(done, done)
    .done();
  });

  describe('Db::record.get()', function () {
    it('should get the record with the given rid', function (done) {
      this.db.record.get('#5:0')
      .then(function (record) {
        record['@class'].should.equal('OUser');
        record['@rid'].should.have.properties({
          cluster: 5,
          position: 0
        });
        done();
      }, done).done();
    });
  });

  describe('Db::record.create()', function () {
    it('should create a record', function (done) {
      this.db.record.create({
        '@class': 'OUser',
        name: 'testuser',
        password: 'testpassword',
        status: 'ACTIVE'
      })
      .then(function (record) {
        createdRID = record['@rid'];
        done();
      }, done).done();
    });
  });

  describe('Db::record.update()', function () {
    it('should update a record', function (done) {
      this.db.record.update({
        '@rid': createdRID,
        '@options': {
          preserve: true
        },
        name: 'testuserrenamed',
      })
      .then(function (record) {
        record.name.should.equal('testuserrenamed');
        done();
      }, done).done();
    });
  });

  describe('Db::record.meta()', function () {
    it('should get the metadata for a record', function (done) {
      this.db.record.meta(createdRID)
      .then(function (record) {
        record['@version'].should.be.above(0);
        done();
      }, done).done();
    });
  });

  describe('Db::record.delete()', function () {
    it('should delete a record', function (done) {
      this.db.record.delete(createdRID)
      .then(function (result) {
        done();
      }, done).done();
    });
  });


});