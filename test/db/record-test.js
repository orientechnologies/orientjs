var createdRID;

describe("Database API - Record", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_record')
    .bind(this)
    .then(function () {
      return this.db.class.get('OUser');
    })
    .then(function (OUser) {
      return OUser.property.create({
        name: 'linkedTest1',
        type: 'Link'
      })
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_record')
  });

  describe('Db::record.get()', function () {
    it('should get the record with the given rid', function () {
      return this.db.record.get('#5:0')
      .then(function (record) {
        record['@class'].should.equal('OUser');
        record['@rid'].should.have.properties({
          cluster: 5,
          position: 0
        });
      });
    });
    it('should get the record with a fetch plan', function () {
      return this.db.record.get({
        '@rid': '#5:0',
        '@options': {
          fetchPlan: '*:-1'
        }
      })
      .then(function (record) {
        record['@class'].should.equal('OUser');
        record['@rid'].should.have.properties({
          cluster: 5,
          position: 0
        });
        record.roles.length.should.be.above(0);
        record.roles[0]['@class'].should.equal('ORole');
      });
    });
  });

  describe('Db::record.create()', function () {
    it('should create a record', function () {
      return this.db.record.create({
        '@class': 'OUser',
        name: 'testuser',
        password: 'testpassword',
        status: 'ACTIVE'
      })
      .then(function (record) {
        createdRID = record['@rid'];
      });
    });

    it('should create a record with a dynamic linked field', function () {
      return this.db.record.create({
        '@class': 'OUser',
        name: 'othertestuser',
        password: 'testpassword',
        status: 'ACTIVE',
        linkedTest1: "#5:0", // defined link field
        linkedTest2: "#5:1" // dynamic field
      })
      .bind(this)
      .then(function (obj) {
        return this.db.record.get(obj['@rid']);
      })
      .then(function (record) {
        record.name.should.equal('othertestuser');
        expect(record.linkedTest1).to.equal(null); // because we did not pass a RID.
        expect(typeof record.linkedTest2).to.equal('string'); // because we did not pass a RID, this is not a link
        record.linkedTest2.should.equal('#5:1');
      });
    });

    it('should create a record with a dynamic linked field, with RIDs', function () {
      return this.db.record.create({
        '@class': 'OUser',
        name: 'othertestuser2',
        password: 'testpassword',
        status: 'ACTIVE',
        linkedTest1: new LIB.RID("#5:0"), // defined field
        linkedTest2: new LIB.RID("#5:1") // dynamic field
      })
      .bind(this)
      .then(function (obj) {
        return this.db.record.get(obj['@rid']);
      })
      .then(function (record) {
        record.name.should.equal('othertestuser2');
        record.linkedTest1.should.be.an.instanceOf(LIB.RID); // a real link
        record.linkedTest2.should.be.an.instanceOf(LIB.RID); // a real link
      });
    });
  });

  describe('Db::record.update()', function () {
    it('should update a record', function () {
      return this.db.record.update({
        '@rid': createdRID,
        '@options': {
          preserve: true
        },
        name: 'testuserrenamed',
      })
      .then(function (record) {
        record.name.should.equal('testuserrenamed');
      });
    });
  });

  describe('Db::record.meta()', function () {
    it('should get the metadata for a record', function () {
      return this.db.record.meta(createdRID)
      .then(function (record) {
        record['@version'].should.be.above(0);
      });
    });
  });

  describe('Db::record.delete()', function () {
    it('should delete a record', function () {
      return this.db.record.delete(createdRID);
    });
  });



});