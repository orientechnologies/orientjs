describe("Database API - Batch Script", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_batch_script')
      .bind(this)
  });
  after(function () {
    return DELETE_TEST_DB('testdb_batch_script');
  });


  it('should return composite object',function(){
    var query = 'begin\n' +
      'let test = select from OUser\n' +
      'let count = select COUNT(*) from OUser\n' +
      'let meta = select * from ( select expand(classes) from metadata:schema ) WHERE name = \'OUser\'\n' +
      'let rez = select $test, $count, $meta \n' +
      'commit retry 100\n' +
      'return $rez';

    return this.db.query(query,{class: 's'}).then(function (response){
      //console.log(JSON.stringify(response));
    });
  })

  it('should return nested object', function () {

    return this.db.query('select *,$currentUser from OUser let $currentUser = (select name from OUser where $parent.current.name = $current.name )', {class: 's'}).then(function (response) {
      //console.log(response[0].$currentUser);
    });
  })

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


  ifSupportedIt('should return correct object ', function (done) {


    return this.db.query("return [1,2]", {class: 's'})
      .then(function (res) {
        res[0].should.eql(1);
        res[1].should.eql(2);
      });
  });

  ifSupportedIt('should return correct array custom', function () {
    return this.db.query("let $v = select from V ; let $ouser = select from OUser; let $updated = update V set name = 'Test' where key = 'notFound'; return [$v,$ouser,$updated]", {class: 's'})
      .then(function (res) {
        Array.isArray(res[0]).should.be.true;
        Array.isArray(res[1]).should.be.true;
        res[2].should.be.eql(0);
      });
  });


  ifSupportedIt('should return correct object custom', function () {
    return this.db.query("let $v = select from V ; let $ouser = select from OUser; let $updated = update V set name = 'Test' where key = 'notFound'; return { 'v' :  $v,'user' : $ouser, 'updated' : $updated }", {class: 's'})
      .then(function (res) {
        (typeof res[0]).should.be.eql('object');
        Array.isArray(res[0].v).should.be.true;
        Array.isArray(res[0].user).should.be.true;
        res[0].updated.should.be.eql(0);

      });
  });

  ifSupportedIt('should return complex result set from transaction', function () {
    return this.db
      .let('vert', 'create vertex V set name="nameA"')
      .let('vert1', 'create vertex V set name="nameB"')
      .let('edge1', 'create edge E from $vert to $vert1')
      .commit(100)
      .return('[$vert,$vert1,$edge1[0]]')
      .all()
      .then(function (result) {
        result.length.should.equal(3);
        result[0]["@class"].should.equal('V');
        result[1]["@class"].should.equal('V');
        result[2]["@class"].should.equal('E');
      });
  });

  ifSupportedIt('should execute a delete query', function () {
    return this.db.query('delete from OUser where name=:name', {
      params: {
        name: 'Samson'
      }
    }).then(function (response) {
      response[0].should.eql('0');
    });
  });

  function ifSupportedIt(text, fn) {
    it(text, function () {
      if (TEST_SERVER.transport.connection.protocolVersion >= 32) {
        return fn.call(this);
      }
      else {
        console.log('        skipping, "' + text + '": operation not supported by OrientDB version');
      }
    });
  }
});
