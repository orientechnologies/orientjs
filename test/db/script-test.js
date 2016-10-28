describe("Database API - Batch Script", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_batch_script')
      .bind(this)
      .then(function () {
        return USE_ODB("testdb_batch_script").open();
      }).then(function (db) {
        this.db = db;
      })

  });
  after(function () {
    return DELETE_TEST_DB('testdb_batch_script');
  });


  //it('should return composite object', function () {
  //  var query = 'begin\n' +
  //    'let test = select from OUser\n' +
  //    'let count = select COUNT(*) from OUser\n' +
  //    'let meta = select * from ( select expand(classes) from metadata:schema ) WHERE name = \'OUser\'\n' +
  //    'let rez = select $test, $count, $meta \n' +
  //    'commit retry 100\n' +
  //    'return $rez';
  //
  //  return this.db.query(query, {class: 's'}).then(function (response) {
  //    console.log(JSON.stringify(response));
  //  });
  //})

  //it('should return nested object', function () {
  //
  //  return this.db.query('select *,$currentUser from OUser let $currentUser = (select name from OUser where $parent.current.name = $current.name )', {class: 's'}).then(function (response) {
  //    console.log(response[0]);
  //  });
  //})

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


  ifSupportedIt('should return roles as results from transaction', function () {
    return this.db
      .let('roles', 'select expand(roles) from OUser ')

      .commit(100)
      .return('$roles')
      .all()
      .then(function (result) {
        result.length.should.equal(3);
        result[0]["@class"].should.equal('ORole');
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


  //  OrientDB >= 2.2.9


  IF_ORIENTDB_MAJOR('2.2.9', 'should return expanded object', function (done) {

    return this.db.query("let $u = select from OUser limit 1; return [first($u),1,2]", {class: 's'})
      .then(function (res) {
        (typeof res[0]).should.be.eql('object');
        res[0]["@class"].should.be.eql('OUser');
        res[1].should.eql(1);
        res[2].should.eql(2);
      });

  });

  IF_ORIENTDB_MAJOR('2.2.9', 'should return expanded select results with map', function (done) {
    var query = 'begin\n' +
      'let test = select from OUser\n' +
      'let count = select COUNT(*) from OUser\n' +
      'let meta = select * from ( select expand(classes) from metadata:schema ) WHERE name = \'OUser\'\n' +
      'let rez = { test:  $test, count :  $count, meta: $meta  }\n' +
      'commit retry 100\n' +
      'return $rez';

    return this.db.query(query, {class: 's'}).then(function (result) {
      result[0]['test'][0]["@class"].should.equal('OUser');
      result[0]['count'][0]["COUNT"].should.equal(3);
      result[0]['meta'][0].name.should.equal('OUser');
    });

  });

  IF_ORIENTDB_MAJOR('2.2.9', 'should return expanded select results with array', function (done) {
    var query = 'begin\n' +
      'let test = select from OUser\n' +
      'let count = select COUNT(*) from OUser\n' +
      'let meta = select * from ( select expand(classes) from metadata:schema ) WHERE name = \'OUser\'\n' +
      'let rez = [$test, $count, $meta] \n' +
      'commit retry 100\n' +
      'return $rez';

    return this.db.query(query, {class: 's'}).then(function (result) {
      result[0][0]["@class"].should.equal('OUser');
      result[1][0]["COUNT"].should.equal(3);
      result[2][0].name.should.equal('OUser');
    });

  });

  IF_ORIENTDB_MAJOR('2.2.9', 'should return expanded objects with different rids', function (done) {

    return this.db.query(" begin;let $a = select 'a' as a ; let $b = select 'a' as b; return [$a,$b]", {class: 's'})
      .then(function (res) {
        res[0][0]["@rid"].should.not.eql(res[1][0]["@rid"]);
      });

  });


  IF_ORIENTDB_MAJOR('2.2.9', 'should return mixed result set from transaction', function () {
    return this.db
      .let('vert', 'create vertex V set name="nameA"')
      .let('vert1', 'update V set name="nameB" where name = "notfound"')
      .let('selected', 'select from V limit 1')
      .let('vert2', 'update $selected set name="nameB" ')
      .commit(100)
      .return('[$vert,$vert1,$vert2]')
      .all()
      .then(function (result) {
        result.length.should.equal(3);
        result[0]["@class"].should.equal('V');
        result[1].should.equal(0);
        result[2].should.equal(1);
      });
  });


  IF_ORIENTDB_MAJOR('2.2.9', 'should return complex result set from transaction', function () {
    return this.db
      .let('vert', 'create vertex V set name="nameA"')
      .let('vert1', 'create vertex V set name="nameB"')
      .let('edge1', 'create edge E from $vert to $vert1')
      .commit(100)
      .return('[$vert,$vert1,$edge1]')
      .all()
      .then(function (result) {
        result.length.should.equal(3);
        result[0]["@class"].should.equal('V');
        result[1]["@class"].should.equal('V');
        Array.isArray(result[2]).should.be.true;
        result[2][0]["@class"].should.equal('E');
      });
  });


  IF_ORIENTDB_MAJOR('2.2.9', 'should return roles in array from transaction', function () {

    return this.db
      .let('roles', 'select expand(roles) from OUser ')

      .commit(100)
      .return('[$roles]')
      .all()
      .then(function (result) {
        result.length.should.equal(1);
        Array.isArray(result[0]).should.be.true;
        result[0][0]["@class"].should.equal('ORole');
      });
  });


  IF_ORIENTDB_MAJOR('2.2.9', 'should return complex result set from transaction with object notation', function () {
    return this.db
      .let('vert', 'create vertex V set name="nameA"')
      .let('vert1', 'create vertex V set name="nameB"')
      .let('edge1', 'create edge E from $vert to $vert1')
      .commit(100)
      .return(' { "v1" : $vert, "v2" : $vert1 , "e" : $edge1}')
      .all()
      .then(function (result) {

        result.length.should.equal(1);
        result[0]["v1"]['@class'].should.equal('V');
        result[0]["v2"]['@class'].should.equal('V');
        Array.isArray(result[0]["e"]).should.be.true;
        result[0]["e"][0]["@class"].should.equal('E');
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
