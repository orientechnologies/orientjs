var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

var document = {
  _class: "FantasyPerson",
  name: "it's me, \\ \"",
  birthday: new Date(),
  fingers: 20,
  a_float: 123.4,
  like_it: true,
  linked_to: "#1:1",
  last_time_in: { name: "Turin, Italy", when: new Date() },
  cities: [{ name: "Turin, Italy" }],
  known_os_list: [ "linux" ],
  zero_is: null
}

var serialized_document = "FantasyPerson@name:\"it's me, \\\\ \\\"\",birthday:" + Math.floor(document.birthday.getTime() / 1000) + "t,fingers:20,a_float:123.4f,like_it:true,linked_to:#1:1,last_time_in:(name:\"Turin, Italy\",when:" + Math.floor(document.last_time_in.when.getTime() / 1000) + "t),cities:(name:\"Turin, Italy\")known_os_list:[\"linux\"],zero_is:";

console.log(document);
console.log(parser.serializeDocument(document));
console.log(serialized_document);
console.log(parser.deserializeDocument(parser.serializeDocument(document)));

assert.equal(serialized_document, parser.serializeDocument(document));
assert.equal(document, parser.deserializeDocument(serialized_document));
