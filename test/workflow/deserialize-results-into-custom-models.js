describe("Deserialize results into custom models", function () {
  before(function () {
    return CREATE_TEST_DB(this, 'testdb_dbapi_workflow2');
  });
  after(function () {
    return DELETE_TEST_DB('testdb_dbapi_workflow2');
  });
  it('should load a single user', function () {
    return this.db
    .select()
    .from('OUser')
    .fetch('roles:-1')
    .transform({
      roles: Role
    })
    .transform(User)
    .limit(1)
    .one()
    .then(function (user) {
      user.should.be.an.instanceOf(User);
      user.roles.length.should.be.above(0);
      user.roles[0].should.be.an.instanceOf(Role);
    });
  });
  it('should load a list of users', function () {
    return this.db
    .select()
    .from('OUser')
    .fetch('roles:-1')
    .transform({
      roles: Role
    })
    .transform(User)
    .all()
    .then(function (users) {
      users.length.should.be.above(0);
      users[0].should.be.an.instanceOf(User);
      users[0].roles.length.should.be.above(0);
      users[0].roles[0].should.be.an.instanceOf(Role);
    });
  });
});


// Mock models



function User (config) {
  if (Array.isArray(config)) {
    return config.map(function (item) {
      return new User(item);
    });
  }
  else if (!(this instanceof User)) {
    return new User(config);
  }
  else if (config)
    this.configure(config);
}


User.prototype.configure = function (config) {
  var keys = Object.keys(config),
      total = keys.length,
      key, i;

  for (i = 0; i < total; i++) {
    key = keys[i];
    this[key] = config[key];
  }
  return this;
};



function Role (config) {
  if (Array.isArray(config)) {
    return config.map(function (item) {
      return new Role(item);
    });
  }
  else if (!(this instanceof Role)) {
    return new Role(config);
  }
  else if (config)
    this.configure(config);
}


Role.prototype.configure = User.prototype.configure;