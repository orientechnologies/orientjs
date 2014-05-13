var Promise = require('bluebird');

describe("Bug #27: Slow compared to Restful API", function () {
  this.timeout(10 * 10000);
  var LIMIT = 5000;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_27_slow')
    .bind(this)
    .then(function () {
      return this.db.class.create('School', 'V');
    })
    .then(function (item) {
      this.class = item;
      return item.property.create([
        {
          name: 'name',
          type: 'String',
          mandator: true
        },
        {
          name: 'address',
          type: 'String'
        }
      ])
    })
    .then(function () {
      var rows = [],
          total = LIMIT,
          i, row;
      for (i = 0; i < total; i++) {
        row = {
          name: 'School ' + i,
          address: (122 + i) + ' Fake Street'
        };
        rows.push(row);
      }
      return this.class.create(rows);
    })
    .then(function (results) {
      results.length.should.equal(LIMIT);
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_27_slow');
  });

  it('should load a lot of records quickly, using the binary raw command interface', function () {
    var start = Date.now();
    return this.db.send('command', {
      database: 'testdb_bug_27_slow',
      class: 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery',
      limit: LIMIT * 2,
      query: 'SELECT * FROM School',
      mode: 's'
    })
    .then(function (response) {
      var stop = Date.now();
      response.results[0].content.length.should.equal(LIMIT);
      console.log('Binary Protocol Took ', (stop - start) + 'ms,', Math.round((LIMIT / (stop - start)) * 1000), 'documents per second')
    })
  });

  it('should load a lot of records quickly, using the rest raw command interface', function () {
    var start = Date.now();
    return REST_SERVER.send('command', {
      database: 'testdb_bug_27_slow',
      class: 'com.orientechnologies.orient.core.sql.query.OSQLSynchQuery',
      limit: LIMIT * 2,
      query: 'SELECT * FROM School',
      mode: 's'
    })
    .then(function (response) {
      var stop = Date.now();
      response.results[0].content.length.should.equal(LIMIT);
      console.log('Rest Protocol Took ', (stop - start) + 'ms,', Math.round((LIMIT / (stop - start)) * 1000), 'documents per second')
    })
  });

  it('should load a lot of records quickly', function () {
    var start = Date.now();
    return this.db.select().from('School').all()
    .then(function (results) {
      var stop = Date.now();
      results.length.should.equal(LIMIT);
      console.log('Binary DB Api Took ', (stop - start) + 'ms,', Math.round((LIMIT / (stop - start)) * 1000), 'documents per second')
    })
  });

  it('should load a lot of records, one at a time, using binary', function () {
    var start = Date.now();
    var cluster = this.class.defaultClusterId,
        promises = [],
        i;

    for (i = 0; i < LIMIT; i++) {
      promises.push(this.db.send('record-load', {
        database: 'testdb_bug_27_slow',
        cluster: cluster,
        position: i
      }));
    }

    return Promise.all(promises)
    .then(function (results) {
      var stop = Date.now();
      results.length.should.equal(LIMIT);
      console.log('Binary Record Load Took ', (stop - start) + 'ms,', Math.round((LIMIT / (stop - start)) * 1000), 'documents per second')
    })
  });

  it('should load a lot of records, one at a time, using rest', function () {
    var start = Date.now();
    var cluster = this.class.defaultClusterId,
        promises = [],
        i;

    for (i = 0; i < LIMIT; i++) {
      promises.push(REST_SERVER.send('record-load', {
        database: 'testdb_bug_27_slow',
        cluster: cluster,
        position: i
      }));
    }

    return Promise.all(promises)
    .then(function (results) {
      var stop = Date.now();
      results.length.should.equal(LIMIT);
      console.log('Rest Record Load Took ', (stop - start) + 'ms,', Math.round((LIMIT / (stop - start)) * 1000), 'documents per second')
    })
  });




});