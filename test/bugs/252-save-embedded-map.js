describe("Bug #252: Unable to save plain EmbededMap", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_252')
    .bind(this)
    .then(function () {
      return this.db.class.create('TestEmbeddedMap');
    })
    .then(function (TestEmbeddedMap) {
      return TestEmbeddedMap.property.create([
        {
          name: 'name',
          type: 'string'
        },
        {
          name: 'map',
          type: 'embeddedmap',
          linkedType: 'string'
        },
        {
          name: 'list',
          type: 'embeddedlist'
        }
      ])
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_252');
  });

  it('should insert a map into the database', function () {
    return this.db
    .insert()
    .into('TestEmbeddedMap')
    .set({
      name: 'abc',
      map: {
        k1: 'v1',
        k2: 'v2'
      }
    })
    .one()
    .then(function (res) {
      res.map.k1.should.equal('v1');
    });
  });

  describe('Bug #255: param is not working with embeddedlist', function () {
    it('should allow params in embedded list', function () {
      return this.db.query('INSERT INTO TestEmbeddedMap SET name = :name, list = :list', {
        params: {
          name: 'def',
          list: [
            {
              controller: 'home'
            }
          ]
        }
      })
      .bind(this)
      .then(function () {
        return this.db.select().from('TestEmbeddedMap').where({name: 'def'}).one();
      })
      .then(function (row) {
        row.list[0].controller.should.equal('home');
      });
    });
  });
});
