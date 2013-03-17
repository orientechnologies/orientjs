var assert = require("assert");
var parser = require("../../lib/orientdb/connection/parser");

var obj = {
    name: "obj",
    sub_obj: {
        name: "sub_obj",
        list: [
            [10],
            [20],
            [30]
        ]
    },
    list: [1, 2, 3],
    date: new Date()
};

var newObj = parser.deepClone(obj);

newObj.sub_obj.name = "new_sub_obj";
newObj.sub_obj.list[0].push(15);
newObj.list.push(4);
newObj.date.setHours(23);
newObj.date.setMinutes(59);
newObj.date.setSeconds(59);
newObj.date.setMilliseconds(999);

assert(newObj.sub_obj.name !== obj.sub_obj.name);
assert(newObj.sub_obj.list[0].length > obj.sub_obj.list[0].length);
assert(newObj.list.length > obj.list.length);
assert(newObj.date.getTime() !== obj.date.getTime());