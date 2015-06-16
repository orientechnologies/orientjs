describe('Pull Request #329: Not escaping leading forward slash "(/)"', function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_PR_329');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_PR_329');
  });
  it('should still enable inserting record with field like "/// TE /// ST \\\\\\"', function () {
    return this.db.insert().into('v').set({val: '/// TE /// ST \\\\\\'}).one()
    .then(function (result) {
      result.val.should.equal('/// TE /// ST \\\\\\');
    });
  });

  it('should still enable where clause with field like "/// TE /// ST \\\\\\"', function () {
    return this.db.select().from('v').where({val: '/// TE /// ST \\\\\\'}).one()
    .then(function (result) {
      result.val.should.equal('/// TE /// ST \\\\\\');
    });
  });

});