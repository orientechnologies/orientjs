var Errors = require('../../lib/errors');
describe("Client API", function () {

  before(CAN_RUN(37, function () {

  }))
  it('should create and connect the client', function (done) {
    this.client = new global.CLIENT(TEST_SERVER_CONFIG);
    this.client.connect()
      .then(() => {
        done(0);
      })
  });

  it('should fail to connect the client', function () {
    this.client = new global.CLIENT(Object.assign({}, TEST_SERVER_CONFIG, {
      port: 3535,
      pool: {
        acquireTimeoutMillis: 100
      }
    }));
    return this.client.connect()
      .then(() => {
        throw new Error('Should never happen!');
      }).catch(err => {
        err.should.be.an.instanceOf(Errors.Connection);
      })
  });

  it('should connect the client with multiple servers', function (done) {
    var config = Object.assign({}, TEST_SERVER_CONFIG, {
      port: 3535,
      pool: {
        acquireTimeoutMillis: 100
      },
      servers: [TEST_SERVER_CONFIG]
    })
    this.client = new global.CLIENT(config);
    this.client.connect().then(() => {
      done();
    }).catch(err => {
      throw new Error('Should never happen!');
    })
  });

  it('should connect the client and create/drop a database', function () {
    this.client = new global.CLIENT(TEST_SERVER_CONFIG);
    var dbConfig = {name: "client_test_db_create", storage: "memory"};
    return this.client.connect()
      .then(() => {
        return this.client.create(TEST_SERVER_CONFIG.username, TEST_SERVER_CONFIG.password, dbConfig);
      })
      .then(() => {
        return this.client.exists(TEST_SERVER_CONFIG.username, TEST_SERVER_CONFIG.password, dbConfig);
      })
      .then((response) => {
        response.should.be.eql(true);
        return this.client.drop(TEST_SERVER_CONFIG.username, TEST_SERVER_CONFIG.password, dbConfig);
      })
      .then(() => {
        return this.client.exists(TEST_SERVER_CONFIG.username, TEST_SERVER_CONFIG.password, dbConfig);
      })
      .then((response) => {
        response.should.be.eql(false);
      })
  });

});
