"use strict";
var Bluebird = require('bluebird');

describe("Test sub-query + $parent.$current", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_188')
    .bind(this)
    .then(function () {
      return this.db.class.create('VertexOne','V');
    })
    .then(function (vOneClass) {
      return vOneClass.property.create({
        name: 'uuid',
        type: 'Integer'
      });
    })
    .then(function () {
      return this.db.class.create('VertexTwo','V');
    })
    .then(function (vTwoClass) {
      return vTwoClass.property.create({
        name: 'uuid',
        type: 'Integer'
      });
    })
    .then(function () {
      return this.db.class.create('HAS_EDGE','E');
    })
    .then(function () {
      return this.db
      .create('VERTEX', 'VertexOne')
      .set({
        uuid: 1
      })
      .one();
    })
    .then(function () {
      return this.db
      .create('VERTEX', 'VertexTwo')
      .set({
        uuid: 2
      })
      .one();
    })
    .then(function () {
      return this.db
      .create('VERTEX', 'VertexTwo')
      .set({
        uuid: 3
      })
      .one();
    })
    .then(function () {
      return this.db
      .create('EDGE', 'HAS_EDGE')
      .from(function (s) {
        s
        .select()
        .from('VertexOne')
        .where({uuid: 1});
      })
      .to(function (s) {
        s
        .select()
        .from('VertexTwo')
        .where({uuid: 2});
      })
      .one();
    })
    .then(function () {
      return this.db
      .create('EDGE', 'HAS_EDGE')
      .from(function (s) {
        s
        .select()
        .from('VertexOne')
        .where({uuid: 1});
      })
      .to(function (s) {
        s
        .select()
        .from('VertexTwo')
        .where({uuid: 3});
      })
      .one();
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_188');
  });
/*
  it('should deserialize a value properly', function () {
    var deserializer = this.db.server.transport.connection.protocol.deserializer; // ugh!
    deserializer.deserialize('$VTwo:[#-2:1,#-2:2]').should.eql({
      '@type': 'd',
      '$VTwo': [
        new LIB.RID('#-2:1'),
        new LIB.RID('#-2:2')
      ]
    });
  });
*/
  it("should test if request return a value", function () {
    return this.db.query("SELECT expand($VTwo) FROM VertexOne LET $VTwo = (SELECT uuid FROM (SELECT expand(out('HAS_EDGE')) FROM $parent.$current)) WHERE uuid = 1")
    .then(function (result) {
      result.length.should.equal(2);
      result.forEach(function (item) {
        (item.uuid === 2 || item.uuid === 3).should.be.true;
      });
    });
  });
});
