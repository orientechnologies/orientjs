"use strict";

/**
 * Create a database.
 *
 * @param  {String} name    The name of the database.
 * @param  {String} type    The database type, default to graph.
 * @param  {String} storage The storage type, defaults to plocal.
 */
exports.create = function (name, type, storage) {
  console.log('Creating database with name: ' + name);
  return this.server.create({
    name: name,
    type: type,
    storage: storage
  })
  .then(function () {
    console.log('done.');
  });
};

/**
 * List the databases on the server.
 */
exports.list = function () {
  console.log('The following databases exist on the server:');
  return this.server.list()
  .then(function (dbs) {
    Object.keys(dbs).forEach(function (name) {
      console.log('\t\t' + name);
    });
  });
};

/**
 * Drop a database.
 *
 * @param  {String} name    The name of the database.
 * @param  {String} storage The storage type, defaults to plocal.
 */
exports.drop = function (name, storage) {
  console.log('Deleting database with name: ' + name);
  return this.server.drop({
    name: name,
    storage: storage
  })
  .then(function () {
    console.log('done.');
  });
};
