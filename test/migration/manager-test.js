var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path');



describe("Migration Manager", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_migration')
    .bind(this)
    .then(function () {
      this.manager = new LIB.Migration.Manager({
        db: this.db,
        dir: path.join(__dirname,'..', 'fixtures/migrations')
      });
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_migration');
  });

  describe('Migration.Manager::create()', function () {
    before(function () {
      return this.manager.create('my test migration')
      .bind(this)
      .then(function (filename) {
        this.filename = filename;
      });
    });
    after(function () {
      return fs.unlinkAsync(this.filename);
    })
    it('should create a migration', function () {
      fs.existsSync(this.filename).should.be.true;
    });
  });

  describe('Migration.Manager::listAvailable()', function () {
    it('should list the available migrations', function () {
      return this.manager.listAvailable()
      .then(function (files) {
        files.length.should.be.above(0);
      });
    })
  });

  describe('Migration.Manager::ensureStructure()', function () {
    it('should ensure the migration class exists', function () {
      return this.manager.ensureStructure()
      .then(function (response) {
      });
    })
  });

  describe('Migration.Manager::listApplied()', function () {
    it('should list the applied migrations', function () {
      return this.manager.listApplied()
      .then(function (migrations) {
        migrations.length.should.equal(0);
      });
    })
  });

  describe('Migration.Manager::list()', function () {
    it('should list the missing migrations', function () {
      return this.manager.list()
      .then(function (migrations) {
        migrations.length.should.equal(2);
      });
    })
  });

  describe('Migration.Manager::loadMigration()', function () {
    it('should load the given migration', function () {
      var migration = this.manager.loadMigration('m20140318_014253_my_test_migration');
      migration.name.should.equal('my test migration');
    })
  });

  describe('Migration.Manager::up()', function () {
    it('should migrate up by one', function () {
      return this.manager.up(1)
      .bind(this)
      .then(function (response) {
        response.length.should.equal(1);
        return this.manager.listApplied();
      })
      .then(function (items) {
        items.length.should.equal(1);
        return this.manager.list();
      })
      .then(function (items) {
        items.length.should.equal(1);
      });
    });
    it('should migrate up fully', function () {
      return this.manager.up()
      .bind(this)
      .then(function (response) {
        response.length.should.equal(1);
        return this.manager.list();
      })
      .then(function (items) {
        items.length.should.equal(0);
      });
    });
  });

  describe('Migration.Manager::down()', function () {
    it('should migrate down by one', function () {
      return this.manager.down(1)
      .bind(this)
      .then(function (response) {
        response.length.should.equal(1);
        return this.manager.listApplied();
      })
      .then(function (items) {
        items.length.should.equal(1);
        return this.manager.list();
      })
      .then(function (items) {
        items.length.should.equal(1);
      });
    });
    it('should migrate down fully', function () {
      return this.manager.down()
      .bind(this)
      .then(function (response) {
        response.length.should.equal(1);
        return this.manager.list();
      })
      .then(function (items) {
        items.length.should.equal(2);
      });
    });
  });

});