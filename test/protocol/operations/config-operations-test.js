var dbPoolMin;
describe("Config Operations", function () {
  describe('config-list', function () {
    it('should get a list of configuration values from the server', function (done) {
      TEST_SERVER.send('config-list')
      .then(function (response) {
        response.total.should.be.above(0);
        response.items.length.should.equal(response.total);
        done();
      }, done).done();
    });
  });
  describe('config-get', function () {
    it('should get a particular configuration value from the server', function (done) {
      TEST_SERVER.send('config-get', {
        key: 'db.pool.min'
      })
      .then(function (response) {
        (+response.value).should.be.above(0);
        dbPoolMin = response.value;
        done();
      }, done).done();
    });
  });
  describe('config-set', function () {
    it('should set a particular configuration value from the server', function (done) {
      TEST_SERVER.send('config-set', {
        key: 'db.pool.min',
        value: dbPoolMin || '1'
      })
      .then(function (response) {
        response.success.should.be.true;
        done();
      }, done).done();
    });
  });
});