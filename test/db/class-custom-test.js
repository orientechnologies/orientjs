var Class = require('../../lib/db/class');

describe("Database API - Class - Custom", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_class_custom')
    .bind(this)
    .then(function () {
      return this.db.class.get('OUser');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_class_custom');
  });


  describe('Db::class.custom.set()', function () {
    var jsonInput = {bar: {wat: { greeting: 'hello world!'}}};
    it('should set the value of a custom field', function () {
      return this.class.custom.set('foo', 'bar')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
      });
    });

    it('should set the value of a custom field, with a json encoded value', function () {
      return this.class.custom.set('json', JSON.stringify(jsonInput))
      .then(function (response) {
        JSON.parse(response.json).should.eql(jsonInput);
      });
    });
  });

  describe('Db::class.custom.get()', function () {
    it('should get a given field', function () {
      return this.class.custom.get('foo').should.equal('bar');
    });
  });

  describe('Db::class.custom.unset()', function () {
    it('should unset a custom field', function () {
      return this.class.custom.unset('json')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
      });
    });

  });

});