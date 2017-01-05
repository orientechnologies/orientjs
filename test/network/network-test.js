describe("Network API", function () {

  it('should connect correctly to the server ', function () {
    this.network = new global.NETWORK.ONetworkConnection(TEST_SERVER_CONFIG);
    return this.network.connect().then(() => {
      this.network.should.have.property('protocolVersion');
    });
  });
  it('should fail to connect with wrong address to the server', function (done) {
    this.network = new global.NETWORK.ONetworkConnection(Object.assign({}, TEST_SERVER_CONFIG, {
      port: 3535
    }));
    this.network.connect().then(() => {
      throw new Error('Should never happen!');
    }).catch(() => {
      done();
    });
  });

  it('should catch network error correctly', function (done) {
    this.network = new global.NETWORK.ONetworkConnection(TEST_SERVER_CONFIG);
    this.network.on('error', (err) => {
      err.code.should.be.eql(2);
      err.message.should.be.eql("ECONNRESET");
      done();
    });
    this.network.connect().then(() => {
      this.network.socket.emit('error', {errnum: 104, message: 'ECONNRESET'});
    });
  });


  it('should close the network correctly ', function (done) {
    this.network = new global.NETWORK.ONetworkConnection(TEST_SERVER_CONFIG);
    this.network.on('close', () => {
      done();
    });
    this.network.connect().then(() => {
      this.network.close();
    });
  });

});
