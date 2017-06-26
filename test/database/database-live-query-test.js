var Promise = require('bluebird');
var Errors = require('../../lib/errors');
describe("ODatabase API - Live Query ", function () {


  before(function () {
    return CREATE_DB("test_session_api_query")
      .bind(this)
      .then(function () {
        return TEST_CLIENT.open({name: "test_session_api_query"});
      })
      .then(function (session) {
        this.session = session;
        return this.session.class.create('Test', 'V');
      })
      .then(function (item) {
        this.class = item;
        return this.class.property.create([
          {
            name: 'name',
            type: 'String'
          },
          {
            name: 'creation',
            type: 'DateTime'
          }
        ]);
      })
      .then(function () {
        return this.class.create([
          {
            name: 'a',
            creation: '2001-01-01 00:00:01'
          },
          {
            name: 'b',
            creation: '2001-01-02 12:00:01'
          },
          {
            name: 'c',
            creation: '2009-01-01 00:12:01'
          },
          {
            name: 'd',
            creation: '2014-09-01 00:01:01'
          },
          {
            name: 'e',
            creation: '2014-09-01 00:24:01'
          }
        ])
      });
  });
  after(function () {
    return DELETE_TEST_DB('test_session_api_query');
  });

  it('should subscribe/unsubscribe live query', function (done) {

    var observable = this.session.liveQuery("LIVE SELECT FROM Test");
    observable.subscribe(function (live) {
      throw new Error('Should never happen!');
    }, function (err) {
      throw new Error('Should never happen!');
    }, function () {
      done();
    });

    observable.unsubscribe();


  });

  it('should trigger live query create', function (done) {

    var TOTAL = 2;
    var count = 0;


    var observable = this.session.liveQuery("LIVE SELECT FROM Test");
    observable.subscribe(function (live) {
      count++;
      live.operation.should.eql(1);
      live.data.name.should.eql('a');

      if (count === TOTAL) {
        observable.unsubscribe();
      }
    }, function (err) {
      throw new Error('Should never happen!');
    }, function () {
      done();
    });


    var self = this;
    setTimeout(function () {
      var promises = [];
      for (var i = 0; i < TOTAL; i++) {
        promises.push(self.session.create("VERTEX", "Test")
          .set(
            {
              name: 'a',
              creation: '2001-01-01 00:00:01'
            })
          .one())
      }
      Promise.all(promises).then(function (rec) {
      })
    }, 1000);

  });

  it('should trigger live query create with more subscribers', function (done) {

    var TOTAL = 2;
    var count = 0;
    var isDone = false;

    var observable = this.session.liveQuery("LIVE SELECT FROM Test");

    var observer = {
      next: function (live) {
        count++;
        live.operation.should.eql(1);
        live.data.name.should.eql('a');

        if (count === TOTAL + 2) {
          observable.unsubscribe();
        }
      },
      error: function (err) {
        throw new Error('Should never happen!');
      },
      complete: function () {

        if (!isDone) {
          isDone = true;
          done();
        }
      }
    };
    observable.subscribe(observer);
    observable.subscribe(observer);

    var self = this;
    setTimeout(function () {
      var promises = [];
      for (var i = 0; i < TOTAL; i++) {
        promises.push(self.session.create("VERTEX", "Test")
          .set(
            {
              name: 'a',
              creation: '2001-01-01 00:00:01'
            })
          .one())
      }
      Promise.all(promises).then(function (rec) {
      })
    }, 1000);

  });

  it('should trigger live query updated', function (done) {


    this.session.create("VERTEX", "Test")
      .set(
        {
          name: 'a',
          creation: '2001-01-01 00:00:01'
        })
      .one()
      .then((record) => {
        var observable = this.session.liveQuery("LIVE SELECT FROM Test");
        observable.subscribe(function (live) {
          live.operation.should.eql(2);
          live.data.name.should.eql('b');
          live.before.name.should.eql('a');
          observable.unsubscribe();
        }, function (err) {
          throw new Error('Should never happen!');
        }, function () {
          done();
        });

        var self = this;
        setTimeout(function () {

          record.name = "b";
          self.session.record.update(record)
            .then((updated) => {
            })
        }, 1000);
      });

  });

  it('should trigger live query deleted', function (done) {

    this.session.create("VERTEX", "Test")
      .set(
        {
          name: 'a',
          creation: '2001-01-01 00:00:01'
        })
      .one()
      .then((record) => {
        var observable = this.session.liveQuery("LIVE SELECT FROM Test");
        observable.subscribe(function (live) {
          live.operation.should.eql(3);
          live.data.name.should.eql('a');
          observable.unsubscribe();
        }, function (err) {
          throw new Error('Should never happen!');
        }, function () {
          done();
        });

        var self = this;
        setTimeout(function () {

          self.session.record.delete(record)
            .then((updated) => {
            })
        }, 1000);
      });

  });

  it('should trigger live query error', function (done) {

    this.session.liveQuery("LIVE SELECT FROM Test2")
      .subscribe(function (live) {
        throw new Error('Should never happen!');
      }, function (err) {
        err.should.be.an.instanceOf(Errors.RequestError);
        done();
      }, function () {
        throw new Error('Should never happen!');
      });
  });

});
