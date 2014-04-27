var path = require('path');

describe("CLI", function () {
  beforeEach(function () {
    this.cli = new LIB.CLI();
  });
  describe('CLI::parseOptsFile()', function () {
    it("should parse opts files", function () {
      return this.cli.parseOptsFile(path.join(__dirname, '..', 'fixtures', 'oriento.opts'))
      .then(function (opts) {
        opts.length.should.be.above(1);
      });
    });
  });
  describe('CLI::parseArgv()', function () {
    it("should parse the correct arguments", function () {
      return this.cli.parseArgv(['node', 'oriento', '--cwd='+path.join(__dirname, '..', 'fixtures'), '--dbname=test123'])
      .then(function (argv) {
        argv.dbname.should.equal('test123');
        argv.dbpassword.should.equal('admin');
      });
    });
  });
});