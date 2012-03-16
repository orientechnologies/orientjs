var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

var document = {
  _class: "FantasyPerson",
  name: "it's me, \\ \"",
  birthday: new Date(Math.floor(new Date().getTime() / 1000) * 1000),
  fingers: 20,
  a_float: 123.4,
  like_it: true,
  linked_to: "#1:1",
  last_time_in: { name: "Turin, Italy", when: new Date(Math.floor(new Date().getTime() / 1000) * 1000) },
  cities: [{ name: "Turin, Italy" }],
  known_os_list: [ "linux" ],
  zero_is: null
}

var serialized_document = "FantasyPerson@name:\"it's me, \\\\ \\\"\",birthday:" + Math.floor(document.birthday.getTime() / 1000) + "t,fingers:20,a_float:123.4f,like_it:true,linked_to:#1:1,last_time_in:(name:\"Turin, Italy\",when:" + Math.floor(document.last_time_in.when.getTime() / 1000) + "t),cities:[(name:\"Turin, Italy\")],known_os_list:[\"linux\"],zero_is:";

assert.equal(serialized_document, parser.serializeDocument(document));
assert.equal(JSON.stringify(document), JSON.stringify(parser.deserializeDocument(serialized_document)));

