describe("Bug #80: Bad Base64 input character decimal 95", function () {
  var rid;
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_bug_80')
    .bind(this)
    .then(function () {
      return this.db.class.create('User');
    })
    .then(function (item) {
      this.class = item;
    });
  });
  after(function () {
    return DELETE_TEST_DB('testdb_bug_80');
  });

  var input = {
    "settings": {
      "__type": "Pointer",
      "className": "Settings",
      "objectId": "xdOfM1NauR"
    },
    "acceptedTerms": true,
    "activitiesCount": 16,
    "appFirstUseDate": {
      "__type": "Date",
      "iso": "2014-06-18T21:01:14.057Z"
    },
    "birthday": {
      "__type": "Date",
      "iso": "1989-01-10T00:00:00.000Z"
    },
    "email": "EMAIL_REMOVED@gmail.com",
    "equipment": {
      "1": [
        1,
        2,
        3,
        6,
        7,
        10,
        100,
        101,
        105,
        107,
        108,
        109,
        5,
        11,
        23,
        8,
        13,
        22,
        4
      ]
    },
    "feedOption": 2,
    "followerCount": 0,
    "followingCount": 5,
    "followingFeedLastReadAt": {
      "__type": "Date",
      "iso": "2014-06-23T20:00:46.903Z"
    },
    "gender": 2,
    "goal": 4,
    "height_unit": 1,
    "height_val1": 5,
    "height_val2": 1,
    "lastPushNotificationPrompt": {
      "__type": "Date",
      "iso": "2014-06-22T16:11:51.991Z"
    },
    "lastRatePrompt": {
      "__type": "Date",
      "iso": "2014-06-20T17:06:03.189Z"
    },
    "lastVersionUsed": "3.0.0",
    "level": 3,
    "needsToSeePushNotificationPrompt": false,
    "newFeedLastReadAt": {
      "__type": "Date",
      "iso": "2014-06-19T14:36:09.877Z"
    },
    "numReferrals": 0,
    "platform": 1,
    "popularFeedLastReadAt": {
      "__type": "Date",
      "iso": "2014-06-20T17:06:13.174Z"
    },
    "postCount": 8,
    "seenRatePrompt": true,
    "stream": "a",
    "timezone": "America/Havana",
    "unsubscribedFromWorkoutEmails": true,
    "username": "USERNAME_REMOVED",
    "weight": 120,
    "weight_unit": 1,
    "createdAt": "2014-06-18T21:01:59.471Z",
    "updatedAt": "2014-06-23T20:01:27.888Z",
    "objectId": "OBJID",
    "ACL": {
      "*": {
        "read": true
      },
      "OBJID": {
        "read": true,
        "write": true
      }
    },
    "sessionToken": "36DawJQJgQmmZorP1sRcFAAp3"
  };

  it('should insert the user', function () {
    return this.db.insert().into('User').set(input).one()
    .then(function (response) {
      response.should.have.property('@rid');
    });
  });
});