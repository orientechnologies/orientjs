var Promise = require('bluebird');

describe("Bug #111: expand() returns only RIDs", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_111')
    .bind(this)
    .then(function () {
      return Promise.map([
        'CREATE CLASS Widget EXTENDS V',
        'CREATE PROPERTY Widget.name STRING',
        'CREATE INDEX UniqueWidgetName ON Widget (name) UNIQUE',

        'CREATE CLASS WidgetHasWidget EXTENDS E',
        'CREATE PROPERTY WidgetHasWidget.in LINK Widget',
        'CREATE PROPERTY WidgetHasWidget.out LINK Widget',
        'ALTER PROPERTY WidgetHasWidget.out MANDATORY true',
        'ALTER PROPERTY WidgetHasWidget.in MANDATORY true',
        'CREATE INDEX UniqueWidgetHasWidget ON WidgetHasWidget (out, in) UNIQUE',

        'INSERT INTO Widget SET name = "widget_A"',
        'INSERT INTO Widget SET name = "widget_B"',

        'CREATE EDGE WidgetHasWidget FROM (SELECT FROM Widget WHERE name = "widget_A") TO (SELECT FROM Widget WHERE name="widget_B")',
        'CREATE EDGE WidgetHasWidget FROM (SELECT FROM Widget WHERE name = "widget_B") TO (SELECT FROM Widget WHERE name="widget_A")'
      ], this.db.query.bind(this.db));
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_111');
  });
  it('should return the full record', function () {
    return this.db.query('SELECT expand(out(\'WidgetHasWidget\')) FROM Widget WHERE name = "widget_A"')
    .spread(function (result) {
      result.name.should.equal('widget_B');
    });
  });
});