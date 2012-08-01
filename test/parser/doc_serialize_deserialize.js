var assert = require("assert");
var parser = require("../../lib/orientdb/connection/parser");

var document = {
    "@class": "FantasyPerson",
    "@type": "d",
    name: "it's me, \\ \"",
    birthday: new Date(Math.floor(new Date().getTime() / 1000) * 1000),
    fingers: 20,
    a_float: 123.4,
    like_it: true,
    linked_to: "#1:1",
    last_time_in: { "@type": "d", name: "Turin, Italy", when: new Date(Math.floor(new Date().getTime() / 1000) * 1000) },
    cities: [
        { "@type": "d", name: "Turin, Italy" }
    ],
    known_os_list: [ "linux" ],
    zero_is: null,
    value_with_hash: "#NoSql",
    embedded_map: {
        key: "value"
    }
};

var serialized_document = "FantasyPerson@name:\"it's me, \\\\ \\\"\",birthday:" + Math.floor(document.birthday.getTime() / 1000) + "t,fingers:20,a_float:123.4f,like_it:true,linked_to:#1:1,last_time_in:(name:\"Turin, Italy\",when:" + Math.floor(document.last_time_in.when.getTime() / 1000) + "t),cities:[(name:\"Turin, Italy\")],known_os_list:[\"linux\"],zero_is:,value_with_hash:\"#NoSql\",embedded_map:{\"key\":\"value\"}";

assert.equal(serialized_document, parser.serializeDocument(document));
assert.equal(JSON.stringify(document), JSON.stringify(parser.deserializeDocument(serialized_document)));

serialized_document = "schemaVersion:4,classes:[(name:\"OUser\",shortName:,defaultClusterId:4,clusterIds:[4],overSize:0.0f,strictMode:false,properties:[(name:\"password\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"name\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"roles\",type:15,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:\"ORole\",linkedType:)]),(name:\"ORole\",shortName:,defaultClusterId:3,clusterIds:[3],overSize:0.0f,strictMode:false,properties:[(name:\"mode\",type:17,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:,linkedType:),(name:\"rules\",type:12,mandatory:false,notNull:false,min:,max:,regexp:,linkedClass:,linkedType:17),(name:\"name\",type:7,mandatory:true,notNull:true,min:,max:,regexp:,linkedClass:,linkedType:)])]";
assert.equal(serialized_document.length, parser.serializeDocument(parser.deserializeDocument(serialized_document)).length + 6); //this is because the db is returning 0.0f that javascript parseFloat trasform to a simple 0 (integer), so we are missing tailing ".0f" (3 chars) for 2 times

serialized_document = "EUsesInstanceOf@out:#8:0,in:#18:1,html:{\"path\":\"html/layout\"},config:{\"title\":\"Github Admin\",\"modules\":(githubDisplay:\"github_display\")},complex:(simple1:\"string1\",one_level1:(simple2:\"string2\"),two_levels:(simple3:\"string3\",one_level2:(simple4:\"string4\")))";
assert.equal(serialized_document, parser.serializeDocument(parser.deserializeDocument(serialized_document)));