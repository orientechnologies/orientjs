var createdRID,createdBinaryRID, demoRID1, demoRID2;


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
    //return DELETE_TEST_DB('testdb_dbapi_record')
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
      return this.db.record.get({'@rid': '#5:0'}, {fetchPlan: '*:-1'})
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

  describe('Db::record.get()', function () {
    it('should get records with the given rids', function () {
      return this.db.record.get(['#5:0', '#5:1'])
        .then(function (records) {
          records.forEach(function(record, i){
            record['@class'].should.equal('OUser');
            record['@rid'].should.have.properties({
              cluster: 5,
              position: i
            });
          });
        });
    });
    it('should get records with a fetch plan', function () {
      return this.db.record.get([{'@rid': '#5:0'},{'@rid': '#5:1'}], {fetchPlan: '*:-1'})
        .then(function (records) {
          records.forEach(function(record, i){
            record['@class'].should.equal('OUser');
            record['@rid'].should.have.properties({
              cluster: 5,
              position: i
            });
            record.roles.length.should.be.above(0);
            record.roles[0]['@class'].should.equal('ORole');
          });
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

    //it('should create a raw binary record', function () {
    //  var textToStoreAsBinary = 'lorem ipsum'
    //  var binaryRecord = new Buffer(textToStoreAsBinary);
    //
    //
    //  binaryRecord['@type'] = 'b';
    //  binaryRecord['@class'] = 'V';
    //
    //  return this.db.record.create(binaryRecord)
    //    .bind(this)
    //    .then(function (record) {
    //      createdBinaryRID = record['@rid'];
    //      // get the binary record from the DB
    //      return this.db.record.get(createdBinaryRID);
    //    })
    //    .then(function (record) {
    //      record.value.toString().should.equal(textToStoreAsBinary);
    //      // store the binary record in a new document record
    //
    //      return this.db.record.create({
    //        '@class': 'V',
    //        binary: record,
    //      })
    //    })
    //    .then(function (record) {
    //      // get the document record from the DB
    //      return this.db.record.get(record['@rid']);
    //    })
    //    .then(function (record) {
    //      // recover original text stored as binary from the document record.
    //      var binaryRecord = record.binary.value;
    //      var octects = Object.keys(binaryRecord).reduce(function (acc, key) {
    //        if (key !== 'length' && key !== 'parent') {
    //          return acc.concat([binaryRecord[key]]);
    //        }
    //        return acc;
    //      }, []);
    //      var binaryRecordBuffer = new Buffer(octects);
    //
    //      binaryRecordBuffer.toString().should.equal(textToStoreAsBinary);
    //    });
    //});

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
          demoRID1 = obj['@rid'];
          return this.db.record.get(obj['@rid']);
        })
        .then(function (record) {
          record.name.should.equal('othertestuser');

          //This assert is removed because the expected result is conversion not null
          // because we did not pass a RID.
          // fixed with binary protocol
          var version = this.db.server.transport.connection.protocolVersion;
          var serType = this.db.server.transport.connection.protocol.constants.SERIALIZATION_FORMAT;

          if (version >= 33 && serType === 'onet_ser_v0') {
            expect(record.linkedTest1.cluster).to.equal(5);
            expect(record.linkedTest1.position).to.equal(0);
          } else {
            expect(record.linkedTest1).to.equal(null);
          }
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
          demoRID2 = obj['@rid'];
          demoRID2.should.not.eql(demoRID1);
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
      return this.db.record.update({'@rid': createdRID, name: 'testuserrenamed'}, {preserve: true})
        .then(function (record) {
          record.name.should.equal('testuserrenamed');
        });
    });

    //it('should update a raw binary record', function () {
    //  var textToStoreAsBinary = 'Lorem ipsum dolor sit amet'
    //  var binaryRecord = new Buffer(textToStoreAsBinary);
    //  binaryRecord['@type'] = 'b';
    //  binaryRecord['@rid'] = createdBinaryRID;
    //
    //  return this.db.record.update(binaryRecord, {preserve: false})
    //    .then(function (record) {
    //      record.toString().should.equal(textToStoreAsBinary);
    //    });
    //});

    it('should update a record with a dynamic linked field', function () {
      return this.db.record.get(demoRID1)
        .bind(this)
        .then(function (record) {
          record.wat = 'foo';
          return this.db.record.update(record)
        })
        .then(function (record) {
          // refresh
          return this.db.record.get(demoRID1);
        })
        .then(function (record) {
          record.name.should.equal('othertestuser');
          record.wat.should.equal('foo');

          var version = this.db.server.transport.connection.protocolVersion;
          var serType = this.db.server.transport.connection.protocol.constants.SERIALIZATION_FORMAT;
          //This assert is removed because the expected result is conversion not null
          // because we did not pass a RID.
          // Fixed with binary protocol

          if (version >= 33 && serType === 'onet_ser_v0') {
            expect(record.linkedTest1.cluster).to.equal(5);
            expect(record.linkedTest1.position).to.equal(0);
          } else {
            expect(record.linkedTest1).to.equal(null);
          }


          expect(typeof record.linkedTest2).to.equal('string'); // because we did not pass a RID, this is not a link
          record.linkedTest2.should.equal('#5:1');
        });
    });

    it('should update a record with a dynamic linked field, with RIDs', function () {
      return this.db.record.get(demoRID2)
        .bind(this)
        .then(function (record) {
          record.wat = 'foo';
          return this.db.record.update(record)
        })
        .then(function (record) {
          // refresh
          return this.db.record.get(demoRID2);
        })
        .then(function (record) {
          record.name.should.equal('othertestuser2');
          record.wat.should.equal('foo');
          record.linkedTest1.should.be.an.instanceOf(LIB.RID); // a real link
          record.linkedTest2.should.be.an.instanceOf(LIB.RID); // a real link
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
    //it('should delete a raw binary record', function () {
    //  return this.db.record.delete(createdBinaryRID);
    //});
  });


});
