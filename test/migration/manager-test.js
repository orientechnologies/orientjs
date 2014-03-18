var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path');

describe("Migration Manager", function () {
  before(function () {
    this.manager = new LIB.Migration.Manager({
      server: TEST_SERVER,
      dir: path.join(__dirname,'..', 'fixtures/migrations')
    });
  });

  describe('Migration.Manager::create()', function () {
    before(function (done) {
      this.manager.create('my test migration')
      .bind(this)
      .then(function (filename) {
        this.filename = filename;
        done();
      }, done).done();
    });
    after(function (done) {
      fs.unlinkAsync(this.filename)
      .then(function () {
        done();
      }, done)
      .done();
    })
    it('should create a migration', function () {
      fs.existsSync(this.filename).should.be.true;
    });
  });

  describe('Migration.Manager::list()', function () {
    it('should list the available migrations', function (done) {
      this.manager.list()
      .then(function (files) {
        files.length.should.be.above(0);
        done();
      }, done).done();
    })
  });
});