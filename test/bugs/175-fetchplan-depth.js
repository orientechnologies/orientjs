var Promise = require('bluebird');

describe("Bug #175: Fetchplan depth", function () {
  var hasProtocolSupport;

  function ifSupportedIt(text, fn) {
    it(text, function () {
      if (hasProtocolSupport) {
        return fn.call(this);
      }
    });
  }

  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_175')
      .bind(this)
      .then(function () {
        hasProtocolSupport = this.db.server.transport.connection.protocolVersion >= 28;
        return Promise.all([
          this.db.class.create('SomeVertex', 'V'),
          this.db.class.create('SomeEdge', 'E'),
          this.db.class.create('OtherEdge', 'E')
        ]);
      })
      .spread(function (vertex, edge1, edge2) {
        return Promise.all([
          vertex.property.create([
            {
              name: 'owner',
              type: 'link',
              linkedClass: 'OUser'
            },
            {
              name: 'val',
              type: 'string'
            }
          ]),
          edge1.property.create([
            {
              name: 'foo',
              type: 'string'
            }
          ]),
          edge2.property.create([
            {
              name: 'greeting',
              type: 'string'
            }
          ])
        ]);
      })
      .then(function () {
        return this.db
          .let('thing1', function (s) {
            s
              .create('VERTEX', 'SomeVertex')
              .set({
                owner: new LIB.RID('#5:0'),
                val: 'a'
              });
          })
          .let('thing2', function (s) {
            s
              .create('VERTEX', 'SomeVertex')
              .set({
                owner: new LIB.RID('#5:1'),
                val: 'b'
              });
          })
          .let('edge1', function (s) {
            s
              .create('EDGE', 'OtherEdge')
              .set({
                greeting: 'Hello World'
              })
              .from('$thing2')
              .to('$thing1');
          })
          .create('EDGE', 'SomeEdge')
          .set({
            foo: 'bar'
          })
          .from('$thing1')
          .to('$thing2')
          .commit()
          .all();
      });
  });
  after(function () {
    // return DELETE_TEST_DB('testdb_bug_175');
  });
  ifSupportedIt('should return records using a fetchplan', function () {
    return this.db
      .select()
      .from('SomeVertex')
      .fetch({'*': 1})
      .limit(1)
      .one()
      .then(function (doc) {
        doc.should.have.property('owner');
        doc.owner.should.have.property('name');
        doc.should.have.property('out_SomeEdge');
        doc.should.have.property('in_OtherEdge');

        // allow for difference between 1.7 and 2.0
        if (doc.out_SomeEdge instanceof LIB.Bag) {
          doc.out_SomeEdge = doc.out_SomeEdge.all();
        }
        else if (!Array.isArray(doc.out_SomeEdge)) {
          doc.out_SomeEdge = [doc.out_SomeEdge];
        }
        if (doc.in_OtherEdge instanceof LIB.Bag) {
          doc.in_OtherEdge = doc.in_OtherEdge.all();
        }
        else if (!Array.isArray(doc.in_OtherEdge)) {
          doc.in_OtherEdge = [doc.in_OtherEdge];
        }


        doc.out_SomeEdge.forEach(function (item) {
          item.should.not.be.an.instanceOf(LIB.RID);
        });
        doc.in_OtherEdge.forEach(function (item) {
          item.should.not.be.an.instanceOf(LIB.RID);
        });
      });
  });
  ifSupportedIt('should return records, excluding edges using a fetchplan', function () {
    return this.db.query('SELECT FROM SomeVertex LIMIT 1', {
      fetchPlan: '*:1 in_*:-2 out_*:-2'
    })
      .spread(function (doc) {
        doc.should.have.property('owner');
        doc.owner.should.have.property('name');
        doc.should.have.property('out_SomeEdge');
        doc.should.have.property('in_OtherEdge');

        // allow for difference between 1.7 and 2.0
        if (doc.out_SomeEdge instanceof LIB.Bag) {
          doc.out_SomeEdge = doc.out_SomeEdge.all();
        }
        else if (!Array.isArray(doc.out_SomeEdge)) {
          doc.out_SomeEdge = [doc.out_SomeEdge];
        }
        if (doc.in_OtherEdge instanceof LIB.Bag) {
          doc.in_OtherEdge = doc.in_OtherEdge.all();
        }
        else if (!Array.isArray(doc.in_OtherEdge)) {
          doc.in_OtherEdge = [doc.in_OtherEdge];
        }

        doc.out_SomeEdge.forEach(function (item) {
          item.should.be.an.instanceOf(LIB.RID);
        });
        doc.in_OtherEdge.forEach(function (item) {
          item.should.be.an.instanceOf(LIB.RID);
        });
      });
  });
  ifSupportedIt('should return records, excluding edges using a fetchplan via the query builder', function () {
    return this.db
      .select()
      .from('SomeVertex')
      .fetch({
        '*': 1,
        'in_*': -2,
        'out_*': -2
      })
      .limit(1)
      .one()
      .then(function (doc) {
        doc.should.have.property('owner');
        doc.owner.should.have.property('name');
        doc.should.have.property('out_SomeEdge');
        doc.should.have.property('in_OtherEdge');

        // allow for difference between 1.7 and 2.0
        if (doc.out_SomeEdge instanceof LIB.Bag) {
          doc.out_SomeEdge = doc.out_SomeEdge.all();
        }
        else if (!Array.isArray(doc.out_SomeEdge)) {
          doc.out_SomeEdge = [doc.out_SomeEdge];
        }
        if (doc.in_OtherEdge instanceof LIB.Bag) {
          doc.in_OtherEdge = doc.in_OtherEdge.all();
        }
        else if (!Array.isArray(doc.in_OtherEdge)) {
          doc.in_OtherEdge = [doc.in_OtherEdge];
        }


        doc.out_SomeEdge.forEach(function (item) {
          item.should.be.an.instanceOf(LIB.RID);
        });
        doc.in_OtherEdge.forEach(function (item) {
          item.should.be.an.instanceOf(LIB.RID);
        });
      });
  });

  // ifSupportedIt('should return records,  using a fetchplan -1 ', function () {
  //   return this.db.query('SELECT FROM SomeVertex', {
  //     fetchPlan: 'in_*:-1 out_*:-1'
  //   }).then(function (result) {
  //
  //   })
  // });
});