describe("Database API - Property - Custom", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_property_custom')
    .bind(this)
    .then(function () {
      return this.db.class.get('OUser');
    })
    .then(function (OUser) {
      return OUser.property.get('name');
    })
    .then(function (name) {
      this.prop = name;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_property_custom');
  });


  describe('Db::class::property.custom.set()', function () {
    var jsonInput = {bar: {wat: { greeting: 'hello world!'}}};
    it('should set the value of a custom field', function () {
      return this.prop.custom.set('foo', 'bar')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
      })
    });

    it('should set the value of a custom field, with a json encoded value', function () {
      return this.prop.custom.set('json', JSON.stringify(jsonInput))
      .then(function (response) {
        JSON.parse(response.json).should.eql(jsonInput);
      });
    });
  });

  describe('Db::class::property.custom.get()', function () {
    it('should get a given field', function () {
      this.prop.custom.get('foo').should.equal('bar');
    });
  });

  describe('Db::class::property.custom.unset()', function () {
    it('should unset a custom field', function () {
      return this.prop.custom.unset('json')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
      });
    });

  });

});