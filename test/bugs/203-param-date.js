describe("Issue #203: support dates in parameterised queries", function () {
  var date = new Date(Date.UTC(2015, 0, 17, 22, 5, 12));
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_issue_203')
    .bind(this)
    .then(function () {
      return this.db.query('alter database timezone cet');  // something not UTC to avoid coincidences
    })
    .then(function () {
      return this.db.class.create('dates');
    })
    .then(function (item) {
      this.class = item;
      return this.class.property.create({
        name: 'schemaDate',
        type: 'DateTime'
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_issue_203');
  });

  it('should insert a date in schemaful mode', function () {
    return this.db.insert().into('dates').set({ schemaDate: date }).one()
    .then(function (result) {
      result.should.have.property('@rid');
      result.should.have.property('schemaDate');
      result.schemaDate.should.eql(date);
    });
  });
  
  it('should insert a date in schemaless mode', function () {
    return this.db.insert().into('dates').set({ newProp: date }).one()
    .then(function (result) {
      result.should.have.property('@rid');
      result.should.have.property('newProp');
      result.newProp.should.eql(date);
    });
  });
});
