describe("Network Pool API", function () {


  before(CAN_RUN(37, function () {

  }))
  it('should create the network Pool ', function () {
    this.pool = new global.NETWORK.ONetworkPool(TEST_SERVER_CONFIG);
    this.pool.size().should.be.eql(2)
    this.pool.available().should.be.eql(0)
    this.pool.borrowed().should.be.eql(0)
    this.pool.pending().should.be.eql(0)
  });

  it('should create and acquire a network from Pool ', function () {
    this.pool = new global.NETWORK.ONetworkPool(TEST_SERVER_CONFIG);
    return this.pool.acquire()
      .then((network) => {
        this.pool.size().should.be.eql(2)
        this.pool.borrowed().should.be.eql(1)
        this.pool.pending().should.be.eql(0)
        return this.pool.release(network);
      })
      .then(() => {
        this.pool.size().should.be.eql(2)
        this.pool.borrowed().should.be.eql(0)
        this.pool.pending().should.be.eql(0)
      })
  });

  it('should fail to acquire the second resource from Pool after x timeout', function (done) {
    var config = Object.assign({}, TEST_SERVER_CONFIG);
    config.pool = {
      min: 1,
      max: 1,
      acquireTimeoutMillis: 100
    }
    this.pool = new global.NETWORK.ONetworkPool(config);
    return this.pool.acquire()
      .then((network) => {
        this.pool.size().should.be.eql(1)
        this.pool.available().should.be.eql(0)
        this.pool.borrowed().should.be.eql(1)
        this.pool.pending().should.be.eql(0)
        return this.pool.acquire();
      })
      .then(() => {
        throw new Error('Should never happen!');
      })
      .catch((err) => {
        done();
      })
  });

});
