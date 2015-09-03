var Statement = require('../../lib/db/statement');

describe("Binary Serializer", function () {
    var server, db;
    before(function () {
        server = new LIB.Server({
            host: TEST_SERVER_CONFIG.host,
            port: TEST_SERVER_CONFIG.port,
            username: TEST_SERVER_CONFIG.username,
            password: TEST_SERVER_CONFIG.password,
            transport: 'binary',
            useToken: false
        });
        db = server.use('serializer');
        //return CREATE_TEST_DB(this, 'serializer');

    });
    //after(function () {
    //    return DELETE_TEST_DB('serializer');
    //});
    it('should query and deserialize', function () {

        return db.select().from('Test').limit(1).all()
            .then(function (results) {
                console.log(results[0]);
            })

    });

});