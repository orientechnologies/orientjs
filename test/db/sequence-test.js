"use strict";
var Sequence = require('../../lib/db/sequence');

describe("Database API - Sequence", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_sequence');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_sequence');
  });

describe('Db::sequence.create()', function () {
    it('should create a sequence with the given name', function () {
      return this.db.sequence.create('TestSequence')
      .then(function (item) {
        item.name.should.equal('TestSequence');
        item.type.should.equal('ORDERED');
        item.should.be.an.instanceOf(Sequence);
      });
    });

    it('should create a sequence with the given name , type', function () {
      return this.db.sequence.create('TestSequence1',"ORDERED")
      .then(function (item) {
        item.name.should.equal('TestSequence1');
        item.type.should.equal('ORDERED');
        item.should.be.an.instanceOf(Sequence);
      });
    });

    });
 

  describe('Db::sequence.list()', function () {
    it('should list the sequences in the database', function () {
      return this.db.sequence.list()
      .bind(this)
      .then(function (sequences) {
        sequences.length.should.be.above(0);
        sequences[0].should.be.an.instanceOf(Sequence);
      });
    });
  });

  describe('Db::sequence.get()', function () {
    it('should get the sequence with the given name', function () {
      return this.db.sequence.get('TestSequence1')
      .then(function (item) {
        item.should.be.an.instanceOf(Sequence);
        item.name.should.equal('TestSequence1');
      });
    });
  });


  describe('Db::sequence.drop()', function () {
    it('should delete a sequence with the given name', function () {
      return this.db.sequence.drop('TestSequence');
    });
  });

  describe('Db::sequence.drop()', function () {
    it('should delete a sequence with the given name', function () {
      return this.db.sequence.drop('TestSequence');
    });
  });

});