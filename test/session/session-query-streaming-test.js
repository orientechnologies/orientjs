var Query = require('../../lib/session/session-query');

describe("Session API - Query", function () {

  before(CAN_RUN(37, function () {
    return CREATE_DB("test_session_streaming")
      .then(() => {
        return TEST_CLIENT.open({name: "test_session_streaming"});
      })
      .then((session) => {
        this.session = session;
      })
  }));
  after(function () {
    return DROP_DB("test_session_streaming");
  });

  beforeEach(function () {
    this.query = new Query(this.session);
  });


  describe('Session::query::subscribe()', function () {


    it('should execute a query with page size custom', function (done) {
      return this.session.query('select from OUSer', {
        pageSize: 1
      })
        .reduce(function (acc, val) {
          acc.push(val);
          return acc;
        }, [])
        .subscribe(function (response) {
          response.length.should.be.eql(3);
          done();
        });
    });
  });

  describe('Session::queryBuilder::stream()', function () {
    it('should return one record with stream and limit', function (done) {
      var user;
      var size= 0;
      this.query.select().from('OUser').limit(1).stream().subscribe((response) => {
        user = response;
        size++;
      }, (err) => {

      }, () => {
        size.should.be.eql(1);
        Array.isArray(user).should.be.false;
        user.should.have.property('name');
        done();
      })
    });
  });
});
