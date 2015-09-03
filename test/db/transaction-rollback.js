var path = require('path');
var Bluebird = require('bluebird');

var oriento_lib_root = path.resolve(__dirname, '../../', 'lib');
var oriento_lib = require(oriento_lib_root);

var config = {
    "host": "localhost",
    "port": "2424",
    "pool": {
        "max": 100
    },
    "transport": "binary",
    "username": "root",
    "password": "root",
    "database": {
        "name": "testdb"
    }
}

var TEST_SERVER = new oriento_lib.Server({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    transport: config.transport,
    pool: config.pool,
    useToken: true
});

var record = {
    'name': 'demo',
    'metadata': {
        "genre": [],
        "budget": 0,
        "translation": {"@type": "d", "@version": 0, "title": []},
        "vote_average": 0,
        "type": "trailer",
        "production": {"@type": "d", "@version": 0, "company": [], "country": []},
        "country": [{"name": null, "code": "US", "date": ""}],
        "title": "In Stereo",
        "overview": "David and Brenda are perfect for each other, and everyone knows it except David and Brenda. After a break-up, they each experience their own rough patch. For David, a self-destructive artistic endeavor and a relationship with an immature beauty—for Brenda, a failing acting career, an eviction notice, and a boyfriend who just doesn’t do it for her. A chance encounter brings them together on the streets of New York at a particularly bad time. David invites Brenda to the opening of his first photography exhibit and the stage is set for a night of drinking and flirting which leads to an untraditional proposal of how they can be together without getting back together. A sharply observed, un-romantic comedy by writer/director Mel Rodriguez III, IN STEREO is a stylish and striking first feature that offers an unflinching look at the complexity of modern relationships.",
        "source": {"@type": "d", "@version": 0, "imdb": "tt3478186", "themoviedb": 340189},
        "poster": "http://image.tmdb.org/t/p/original/QfnnGjCpvtJ0aY6IWKKnog2viF.jpg",
        "release_date": "2015-07-03",
        "language": "en",
        "vote_count": 0,
        "credit": {"@type": "d", "@version": 0, "crew": [], "actor": []},
        "release": {"@type": "d", "@version": 0, "country": [{"name": null, "code": "US", "date": "2015-07-03"}]},
        "popularity": 0.159291,
        "revenue": 0
    }
};

describe('Database API', function () {

    before(function () {
        this.timeout(0);

        this.config = config;
        this.collections = {};

        this.db = '';
        this.class = '';
        this.rid = '';

        return TEST_SERVER.create({
            name: this.config.database.name,
            type: 'graph',
            storage: 'plocal'
        })
            .bind(this)
            .then(function (db) {
                this.db = db;
                return db.class.create('test', 'V');
            })
            .then(function (testClass) {
                this.class = testClass;
                return testClass.property.create([
                    {
                        name: 'name',
                        type: 'String'
                    },
                    {
                        name: 'metadata',
                        type: 'EMBEDDEDMAP'
                    }
                ]);
            })
            //.then(function () {
            //    return Bluebird.all([
            //        this.db.index.create({
            //            name: 'test.name',
            //            class: 'test',
            //            properties: 'name',
            //            type: 'FULLTEXT ENGINE LUCENE'
            //        }),
            //        this.db.index.create({
            //            name: 'test.metadata',
            //            class: 'test',
            //            properties: 'metadata',
            //            type: 'FULLTEXT ENGINE LUCENE',
            //        })
            //    ]);
            //})
            .then(function () {
                return this.db.query("select from OUser")
            })
            .then(function () {
               var  q = '\ncreate class Tmp1 extends V\ncreate class Tmp2 extends V\n';

                return this.db.exec(q, {class: "s"})
            })
            //.then(function (res) {
            //    return this.db
            //        .insert()
            //        .into('test')
            //        .set(record)
            //        .transform({
            //            '@rid': function (rid) {
            //                return '#' + rid.cluster + ':' + rid.position;
            //            }
            //        })
            //        .one()
            //})
            //.then(function (result) {
            //    this.rid = result['@rid'];
            //});
    });
    after(function () {
        this.timeout(0);
        //return TEST_SERVER.drop({
        //    name: this.config.database.name,
        //    storage: 'plocal'
        //});
    });

    describe('Db::update()', function () {

        it('should have transaction rollback', function () {
            this.timeout(0);
            var parallel = [];
            var max_try = 100;
            for (i = 0; i < max_try; i++) {
                parallel.push(
                    this.db.let('test', function (s) {
                        s.insert().into('test').set(record);
                    })
                        .commit()
                        .return('$test')
                        .transform({
                            '@rid': function (rid) {
                                return rid.toString();
                            }
                        })
                        .one()
                );
            }
            parallel.push(
                this.db.update("OUser").set({"test": "test"}).scalar()
            );
            return Bluebird.all(parallel);
        });

    });
});