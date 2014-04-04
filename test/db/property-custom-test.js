describe("Database API - Property - Custom", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_property_custom')
    .bind(this)
    .then(function () {
      return this.db.class.get('OUser');
    })
    .then(function (OUser) {
      return OUser.property.get('name');
    })
    .then(function (name) {
      this.prop = name;
    })
    .then(done, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_property_custom')
    .then(done, done)
    .done();
  });


  describe('Db::class::property.custom.set()', function () {
    var jsonInput = {bar: {wat: { greeting: 'hello world!'}}};
    it('should set the value of a custom field', function (done) {
      this.prop.custom.set('foo', 'bar')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
        done();
      }, done)
      .done();
    });

    it('should set the value of a custom field, with a json encoded value', function (done) {
      this.prop.custom.set('json', JSON.stringify(jsonInput))
      .then(function (response) {
        JSON.parse(response.json).should.eql(jsonInput);
        done();
      }, done)
      .done();
    });
  });

  describe('Db::class::property.custom.get()', function () {
    it('should get a given field', function () {
      this.prop.custom.get('foo').should.equal('bar');
    });
  });

  describe('Db::class::property.custom.unset()', function () {
    it('should unset a custom field', function (done) {
      this.prop.custom.unset('json')
      .then(function (response) {
        response.should.eql({foo: 'bar'});
        done();
      }, done)
      .done();
    });

  });

});