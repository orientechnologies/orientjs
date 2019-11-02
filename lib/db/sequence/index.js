"use strict";

var Promise = require('bluebird'),
    RID = require('../../recordid'),
    utils = require('../../utils'),
    errors = require('../../errors');

/**
 * The sequence constructor.
 * @param {Object} config The configuration for the sequence
 */
function Sequence(config) {
    config = config || {};
    if (!(this instanceof Sequence)) {
        return new Sequence(config);
    }
    this.configure(config);
}

//Sequence.prototype.augment = utils.augment;

module.exports = exports = Sequence;
/**
 * The cached sequence items.
 * @type {Object|false}
 */
Sequence.cached = false;
/**
 * Configure the sequence instance.
 * @param  {Object} config The configuration object.
 */
Sequence.prototype.configure = function (config) {
    this.db = config.db;
    this.name = config.name || '';
    this.type = config.type || '';
    this.value = config.value || 0;
    this.start = config.start || 0;
    this.incr = config.incr || 1;
    this.cache = config.cache || 1;

};

/**
 * Return a list of sequences in the db.
 *
 * @param  {Boolean} refresh Whether to refresh the list or not.
 * @promise {Object[]}      An array of  sequences in database.
 */
Sequence.list = function (refresh) {

    if (!refresh && this.sequence.cached) {
        return Promise.resolve(this.sequence.cached.items);
    }
    var query = 'SELECT * FROM  OSequence',
        config = {};

    return this
        .query(query)
        .all()
        .bind(this)
        .then(function (response) {
            return (response ? response : []);
        })
        .then(this.sequence.cacheData)
        .then(function () {
            return this.sequence.cached.items;
        });
};

/**
 * Create a new sequence.
 *
 * @param  {String} name            The name of the sequence to create.
 * @param  {String} type      The type of sequence.
 * @param  {Integer} start The start number.
 * @param  {Integer} incerement The increment number.
 * @param  {Integer} cache     The cache number
 * @promise {Object}                The created sequence object
 */
Sequence.create = function (name, type, start, incerement, cache) {
    var query = 'CREATE SEQUENCE ' + name;
    type = type || "ORDERED";
    if (type) {
        query += ' TYPE ' + type;
    }

    if (start) {
        query += ' START ' + start;
    }

    if (incerement) {
        query += ' INCREMENT ' + incerement;
    }

    if (cache) {
        query += ' CACHE ' + cache;
    }

    return this.command(query)
        .all()
        .bind(this)
        .then(function () {
            return this
                .sequence
                .list(true);
        })
        .then(function (sequences) {
            return this
                .sequence
                .get(name);
        });
};


/**
 * Reload the sequence instance.
 *
 * @promise {Sequence} The sequence instance.
 */
Sequence.prototype.reload = function () {
    return this.db.sequence.get(this.name, true)
        .bind(this)
        .then(function (item) {
            this.configure(item);
            return this;
        });
};

/** update a  sequence.
 *
 * @param  {String} name            The name of the sequence to create.
* @param {Integer} incerement The increment number.
* @param {Integer} cache The cache number
* @param {Integer} start The start number.
* @promise {Object}
The created sequence object
*/
Sequence.update = function (name, start, incerement, cache) {

    var query = 'ALTER SEQUENCE ' + name;

    if (start) {
        query += ' START ' + start;
    }

    if (incerement) {
        query += ' INCREMENT ' + incerement;
    }

    if (cache) {
        query += ' CACHE ' + cache;
    }
    return this.command(query)
        .all()
        .bind(this)
        .then(function () {
            return this
                .sequence
                .get(name, true);
        });
};

/**
 * Delete a Sequence.
 *
 * @param  {String} name The name of the sequence to delete.
 * @param  {Object} config The config.
 * @promise {Db}         The database instance.
 */
Sequence.drop = function (name, config) {
    config = config || {};
    var query = 'DROP SEQUENCE ' + name;
    return this.command(query)
        .all()
        .bind(this)
        .then(function () {
            return this
                .sequence
                .list(true);
        })
        .then(function (sequences) {
            return this;
        });
};

/**
 * Get a sequence by name.
 *
 * @param   {Integer|String} name The name of the sequence.
 * @param   {Boolean} refresh Whether to refresh the data, defaults to false.
 * @promise {Object}          The class object if it exists.
 */
Sequence.get = function (name, refresh) {
    var sequenceName = name.toLocaleUpperCase();
    if (!refresh && this.sequence.cached && this.sequence.cached.names[sequenceName]) {
        return Promise.resolve(this.sequence.cached.names[sequenceName]);
    } else if (!this.sequence.cached || refresh) {
        return this
            .sequence
            .list(refresh)
            .bind(this)
            .then(function () {
                return this.sequence.cached.names[sequenceName] ||
                 Promise.reject(new errors.Request('No such sequence: ' + name));
            });
    } else {
        return Promise.reject(new errors.Request('No such sequence: ' + name));
    }
};

/**
 * Cache the given sequence data for fast lookup later.
 *
 * @param  {Object[]} sequences The sequence objects to cache.
 * @return {Db}                The db instance.
 */
Sequence.cacheData = function (sequences) {
    var total = sequences.length,
        item,
        i;

    sequences = sequences.map(function (item) {
        item.db = this;
        return new Sequence(item);
    }, this);

    this.sequence.cached = {
        names: {},
        items: sequences
    };

    for (i = 0; i < total; i++) {
        item = sequences[i];
        this.sequence.cached.names[item.name.toLocaleUpperCase()] = item;
    }

    return this;
};
