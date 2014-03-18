var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path');



describe("Migration Manager", function () {
  before(function (done) {
    CREATE_TEST_DB(this, 'testdb_dbapi_migration')
    .bind(this)
    .then(function () {
      this.manager = new LIB.Migration.Manager({
        db: this.db,
        dir: path.join(__dirname,'..', 'fixtures/migrations')
      });
      done();
    }, done)
    .done();
  });
  after(function (done) {
    DELETE_TEST_DB('testdb_dbapi_migration')
    .then(done, done)
    .done();
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

  describe('Migration.Manager::listAvailable()', function () {
    it('should list the available migrations', function (done) {
      this.manager.listAvailable()
      .then(function (files) {
        files.length.should.be.above(0);
        done();
      }, done).done();
    })
  });

  describe('Migration.Manager::ensureStructure()', function () {
    it('should ensure the migration class exists', function (done) {
      this.manager.ensureStructure()
      .then(function (response) {
        done();
      }, done).done();
    })
  });

  describe('Migration.Manager::listApplied()', function () {
    it('should list the applied migrations', function (done) {
      this.manager.listApplied()
      .then(function (migrations) {
        migrations.length.should.equal(0);
        done();
      }, done).done();
    })
  });



});