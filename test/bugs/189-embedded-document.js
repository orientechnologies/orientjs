"use strict";
var Bluebird = require('bluebird');

describe("Bug #189: Error inserting new document with embedded document containing link type field", function () {
  var rid;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_189')
    .bind(this)
    .then(function () {
      return Bluebird.all([
        this.db.class.create('Person', 'V'),
        this.db.class.create('Address')
      ])
      .spread(function (Person, Address) {
        return Bluebird.all([
          Person.property.create([
            {
              name: 'name',
              type: 'string'
            },
            {
              name: 'referrer',
              type: 'link'
            },
            {
              name: 'primaryAddress',
              type: 'embedded',
              linkedType: 'Address'
            },
            {
              name: 'addresses',
              type: 'embeddedset',
              linkedType: 'Address'
            }
          ]),
          Address.property.create([
            {
              name: 'link',
              type: 'link'
            },
            {
              name: 'city',
              type: 'string'
            }
          ])
        ]);
      });
    })
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_189');
  });

  it('should insert a person with a primary address', function () {
    var query = this.db
    .create('VERTEX', 'Person')
    .set({
      name: 'Bob',
      referrer: new LIB.RID('#5:0'),
      primaryAddress: {
        '@type': 'document',
        '@class': 'Address',
        city: 'London',
        link: new LIB.RID('#5:0')
      }
    })
    return query.one()
    .then(function (result) {
      result.primaryAddress.city.should.equal('London');
    });
  });


  it('should insert a person with a primary address and some other addresses', function () {
    var query = this.db
    .create('VERTEX', 'Person')
    .set({
      name: 'Alice',
      referrer: new LIB.RID('#5:0'),
      primaryAddress: {
        '@type': 'document',
        '@class': 'Address',
        city: 'London'
      },
      addresses: [
        {
          '@type': 'document',
          '@class': 'Address',
          city: 'London',
          link: new LIB.RID('#5:0')
        },
        {
          '@type': 'document',
          '@class': 'Address',
          city: 'Paris',
          link: new LIB.RID('#5:1')
        }
      ]
    })
    return query.one()
    .then(function (result) {
      result.primaryAddress.city.should.equal('London');
      result.addresses.length.should.equal(2);
      result.addresses.forEach(function (address) {
        (address.city === "London" || address.city === "Paris").should.be.true;
      });
    });
  });

  it('should insert some people using sql batch', function () {
    var query = this.db
    .let('bob', function (s) {
      s
      .create('VERTEX', 'Person')
      .set({
        name: 'Bob',
        referrer: new LIB.RID('#5:0'),
        primaryAddress: {
          '@type': 'document',
          '@class': 'Address',
          city: 'London',
          link: new LIB.RID('#5:0')
        }
      });
    })
    .let('alice', function (s) {
      s
      .create('VERTEX', 'Person')
      .set({
        name: 'Alice',
        referrer: new LIB.RID('#5:0'),
        primaryAddress: {
          '@type': 'document',
          '@class': 'Address',
          city: 'London'
        },
        addresses: [
          {
            '@type': 'document',
            '@class': 'Address',
            city: 'London',
            link: new LIB.RID('#5:0')
          },
          {
            '@type': 'document',
            '@class': 'Address',
            city: 'Paris',
            link: new LIB.RID('#5:1')
          }
        ]
      });
    })
    .return('[$bob,$alice]')
    .commit();

    return query.all()
    .spread(function (bob, alice) {
      bob.primaryAddress.city.should.equal('London');
      alice.primaryAddress.city.should.equal('London');
      alice.addresses.length.should.equal(2);
      alice.addresses.forEach(function (address) {
        (address.city === "London" || address.city === "Paris").should.be.true;
      });
    });
  });
});
