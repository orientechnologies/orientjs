var utils = require('../../lib/utils');

describe("RID Bag", function () {
  describe('Embedded Bag', function () {
    before(function () {
      var self = this;
      return CREATE_TEST_DB(this, 'testdb_dbapi_rid_bag_embedded')
      .bind(this)
      .then(function () {
        return this.db.class.create('Person', 'V');
      })
      .then(function (Person) {
        this.Person = Person;
        return this.db.class.create('Knows', 'E');
      })
      .then(function (Knows) {
        this.Knows = Knows;
        return this.Person.create({
          name: 'John Smith'
        });
      })
      .then(function (subject) {
        var limit = 10,
            i;
        this.subject = subject;
        this.people = [];
        for (i = 0; i < limit; i++) {
          this.people.push({
            name: 'Friend ' + i
          });
        }
        return this.Person.create(this.people);
      })
      .then(function () {
        return this.db.edge
        .from(this.subject['@rid'])
        .to('SELECT * FROM Person WHERE name LIKE "Friend%"')
        .create('Knows');
      });
    });
    after(function () {
      return DELETE_TEST_DB('testdb_dbapi_rid_bag_embedded');
    });

    beforeEach(function () {
      return this.db
      .select()
      .from(this.subject['@rid'])
      .fetch({'*': 2})
      .one()
      .bind(this)
      .then(function (record) {
        this.bag = record.out_Knows;
      });
    });

    it('should load a bag', function () {
      this.bag.should.be.an.instanceOf(LIB.Bag)
      this.bag.type.should.equal(LIB.Bag.BAG_EMBEDDED);
      expect(this.bag.uuid).to.equal(null);
      this.bag.size.should.equal(10);
    });

    it('should iterate the contents in the bag', function () {
      var size = this.bag.size,
          i = 0,
          item;
      while((item = this.bag.next())) {
        item.should.be.an.instanceOf(LIB.RID);
        i++;
      }
      i.should.equal(10);
    });

    it('should return all the contents of the bag', function () {
      var contents = this.bag.all();
      contents.length.should.equal(10);
      contents.forEach(function (item) {
        item.should.have.property('@rid');
      });
    });

    it('should return the right JSON representation', function () {
      var json = utils.jsonify(this.bag)
          decoded = JSON.parse(json);
      decoded.length.should.equal(10);
      decoded.forEach(function (item) {
        item.should.have.property('@rid');
      });
    });

    describe('Optional RIDBags', function () {
      before(function () {
        this.db.server.transport.connection.protocol.deserializer.enableRIDBags = false;
      });
      after(function () {
        this.db.server.transport.connection.protocol.deserializer.enableRIDBags = true;
      });
      it('should optionally disable RIDBags', function () {

        Array.isArray(this.bag).should.be.true;
      });
    });
  });

  describe('Tree Bag', function () {
    before(function () {
      this.timeout(20000);
      var self = this;
      return CREATE_TEST_DB(this, 'testdb_dbapi_rid_bag_tree', 'plocal')
      .bind(this)
      .then(function () {
        return this.db.class.create('Person', 'V');
      })
      .then(function (Person) {
        this.Person = Person;
        return this.db.class.create('Knows', 'E');
      })
      .then(function (Knows) {
        this.Knows = Knows;
        return this.Person.create({
          name: 'John Smith'
        });
      })
      .then(function (subject) {
        var limit = 120,
            i;
        this.subject = subject;
        this.people = [];
        for (i = 0; i < limit; i++) {
          this.people.push({
            name: 'Friend ' + i
          });
        }
        return this.Person.create(this.people);
      })
      .then(function () {
        return this.db.edge
        .from(this.subject['@rid'])
        .to('SELECT * FROM Person WHERE name LIKE "Friend%"')
        .create('Knows');
      });
    });
    after(function () {
      return DELETE_TEST_DB('testdb_dbapi_rid_bag_tree', '');
    });

    beforeEach(function () {
      return this.db
      .select()
      .from(this.subject['@rid'])
      .fetch({'*': 2})
      .one()
      .bind(this)
      .then(function (record) {
        this.bag = record.out_Knows;
      });
    });

    it('should load a bag', function () {
      this.bag.should.be.an.instanceOf(LIB.Bag)
      this.bag.type.should.equal(LIB.Bag.BAG_TREE);
      expect(this.bag.uuid).to.equal(null);
      // > note: following behavior changes since protocol 19
      // old versions return the number of records, newer ones don't.
      // newer versions must ask orient
      expect(this.bag.size === -1 || this.bag.size === 120).to.be.true;
    });
  });
});
