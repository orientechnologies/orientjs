var assert = require("assert");
var parser = require("../../lib/orientdb/connection/parser");

var document = {
  "@class": "FantasyPerson",
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

serialized_document = "schemaVersion:4,classes:[(name:\"OUser\",shortName:,defaultClusterId:4,clusterIds:[4],overSize:0.0f,strictMode:false,properties:[(name:\"password\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"name\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"roles\",type:15,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:\"ORole\",linkedType:)]),(name:\"ORole\",shortName:,defaultClusterId:3,clusterIds:[3],overSize:0.0f,strictMode:false,properties:[(name:\"mode\",type:17,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"rules\",type:12,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:,linkedType:17),(name:\"name\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:)])]";
assert.equal(serialized_document.length, parser.serializeDocument(parser.deserializeDocument(serialized_document)).length + 6); //this is because the db is returning 0.0f that javascript parseFloat trasform to a simple 0 (integer), so we are missing tailing ".0f" (3 chars) for 2 times
