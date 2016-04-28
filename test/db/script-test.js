describe("Database API - Batch Script", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_batch_script')
      .bind(this)
  });
  after(function () {
    return DELETE_TEST_DB('testdb_batch_script');
  });


  it('should create Vertex with strange characters [1/2]', function () {

    var val = "test \" test )";
    return this.db
      .let('myVertex', function (v) {
        v.create("VERTEX", "V")
          .set({
            msg: val
          });
      })
      .commit()
      .return('$myVertex')
      .all()
      .then(function (res) {
        res[0].msg.should.eql(val);
      });
  });
  it('should create Vertex with strange characters [2/2]', function () {

    var val = '";"';
    return this.db
      .let('myVertex', function (v) {
        v.create("VERTEX", "V")
          .set({
            msg: val
          });
      })
      .commit()
      .return('$myVertex')
      .all()
      .then(function (res) {
        res[0].msg.should.eql(val);
      });
  });

  it('should return correct object ', function () {

    return this.db.query("return [1,2]", {class: 's'})
      .then(function (res) {
        res[0].should.eql(1);
        res[1].should.eql(2);
      });
  });

  it('should return correct array custom', function () {
    return this.db.query("let $v = select from V ; let $ouser = select from OUser; let $updated = update V set name = 'Test' where key = 'notFound'; return [$v,$ouser,$updated]", {class: 's'})
      .then(function (res) {
        Array.isArray(res[0]).should.be.true;
        Array.isArray(res[1]).should.be.true;
        res[2].should.be.eql(0);
      });
  });


  it('should return correct object custom', function () {
    return this.db.query("let $v = select from V ; let $ouser = select from OUser; let $updated = update V set name = 'Test' where key = 'notFound'; return { 'v' :  $v,'user' : $ouser, 'updated' : $updated }", {class: 's'})
      .then(function (res) {
        (typeof res[0]).should.be.eql('object');
        Array.isArray(res[0].v).should.be.true;
        Array.isArray(res[0].user).should.be.true;
        res[0].updated.should.be.eql(0);

      });
  });

  it('should execute a delete query', function () {
    return this.db.query('delete from OUser where name=:name', {
      params: {
        name: 'Samson'
      }
    }).then(function (response) {
      response[0].should.eql('0');
    });
  });

});
