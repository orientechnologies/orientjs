var path = require('path');

describe("CLI", function () {
  beforeEach(function () {
    this.cli = new LIB.CLI();
  });
  describe('CLI::parseOptsFile()', function () {
    it("should parse opts files", function (done) {
      this.cli.parseOptsFile(path.join(__dirname, '..', 'fixtures', 'node-orientdb.opts'))
      .then(function (opts) {
        opts.length.should.be.above(1);
        done();
      }, done)
      .done();
    });
  });
  describe('CLI::parseArgv()', function () {
    it("should parse the correct arguments", function (done) {
      this.cli.parseArgv(['node-orientdb', '--cwd='+path.join(__dirname, '..', 'fixtures'), '--dbname=test123'])
      .then(function (argv) {
        argv.dbname.should.equal('test123');
        argv.dbpassword.should.equal('admin');
        done();
      }, done)
      .done();
    });
  });
});