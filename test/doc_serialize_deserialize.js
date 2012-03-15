var assert = require("assert");
var parser = require("../lib/orientdb/connection/parser");

var document = {
  _class: "FantasyPerson",
  name: "it's my name",
  birthday: new Date(),
  fingers: 20,
  like_it: true,
  linked_to: "#1:1",
  last_time_in: { name: "Turin", when: new Date() },
  known_os_list: [ "linux" ],
  zero_is: null
}

var serialized_document = "FantasyPerson@name:\"it's my name\",birthday:" + Math.floor(document.birthday.getTime() / 1000) + "t,fingers:20,like_it:true,linked_to:#1:1,last_time_in:(name:\"Turin\",when:" + Math.floor(document.last_time_in.when.getTime() / 1000) + "t),known_os_list:[\"linux\"],zero_is:";

console.log(serialized_document);
console.log(parser.serializeDocument(parser.deserializeDocument(serialized_document)));

assert.equal(serialized_document, parser.serializeDocument(document));

assert.equal(document, parser.deserializeDocument(serialized_document));
