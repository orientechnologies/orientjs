describe("Bug #79: Error when inserting", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_79')
    .bind(this)
    .then(function () {
      return this.db.class.create('User');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_79');
  });

  it('Let me create a property immediately after creating a class', function () {
    var data = {
      "acceptedTerms":true,
      "activitiesCount":0,
      "appFirstUseDate":{"__type":"Date","iso":"2013-03-26T10:36:23.050Z"},
      "email":"REMOVED@hotmail.com",
      "emailVerified":true,
      "first_name":"Imogen",
      "followerCount":0,
      "followingCount":0,
      "gender":2,
      "goal":2,
      "height_unit":1,
      "height_val1":5,
      "height_val2":3,
      "homeEquipment":[4,3,6,105,107],
      "last_name":".",
      "level":3,
      "numReferrals":0,
      "postCount":0,
      "subscribedToPush":true,
      "timezone":"America/New_York",
      "unsubscribedFromWorkoutEmails":true,
      "username":"imogenxoxo",
      "weight":93,
      "weight_unit":1,
      "createdAt":"2013-03-26T10:38:04.971Z",
      "updatedAt":"2014-04-09T17:18:38.577Z",
      "objectId":"l402K4JOu4",
      "ACL":{"*":{"read":true},"l402K4JOu4":{"read":true,"write":true}},
      "sessionToken":"sue1t43xj80miwi4s3ky49ybo"
    };

    return this.db.insert().into('User').set(data).one()
    .then(function (res) {
      res.acceptedTerms.should.equal(true);
    });
  });
});