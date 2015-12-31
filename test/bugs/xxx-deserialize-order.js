var dbname = 'testdb_bug_deserialize_order';
var dtval = "946684800000"; // 2000, January 1
var lval = (Math.pow(2, 53) - 1).toString() + "2"; // Number.MAX_SAFE_INTEGER
var sval = "13000";
var fval = "2.132";
var dbval = "0.2192857391";

describe("Bug: rest deserialization order", function () {
  before(function () {
    return CREATE_TEST_DB(this, dbname)
    .bind(this)
    .then(function () {
      return this.db.class.create('User', 'V');
    }).then(function (User) {
     return User.property.create([
        { name: 'dtval', type: 'date' },
        { name: 'lval', type: 'long' },
        { name: 'sval', type: 'short' },
        { name: 'fval', type: 'float' },
        { name: 'dbval', type: 'double' },
      ]);
    }).then(function () {
      return this.db.exec('INSERT INTO User (dtval, lval, sval, fval, dbval) ' +
        'VALUES (' + [dtval, lval, sval, fval, dbval].join(",") + ')');
    }).then(function () {
      this.restdb = REST_SERVER.use(dbname);
    });
  });
  after(function () {
    this.restdb = undefined;
    return DELETE_TEST_DB(dbname);
  });
  it('should not throw an error on deserializtion', function () {
    return this.restdb.select().from("User").all().then(function (users) {
      users.should.have.lengthOf(1);
      users[0].dtval.should.be.an.instanceOf(Date);
      (users[0].dtval.getTime() - (users[0].dtval.getTimezoneOffset()*60*1000))
        .toString().should.equal(dtval);
      users[0].lval.toString().should.be.exactly(lval);
      users[0].sval.should.be.exactly(+sval);
      users[0].fval.should.be.exactly(+fval);
      users[0].dbval.should.be.exactly(+dbval);
    });
  });
});
