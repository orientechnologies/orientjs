//
//path = require('path');
//global.LIB_ROOT = path.resolve(__dirname, '..', 'lib');
//
//global.LIB = require(LIB_ROOT);
//var deserializer = require(LIB_ROOT + '/transport/binary/protocol30/deserializer-csv.js');
//var fs = require('fs');
//
//fs.readFile('./test/content.csv','utf8',function(err,data){
//
//var limit = 1000000,
//  input = data,
//  size = input.length * limit,
//  start = Date.now();
//
//for (var i = 0; i < limit; i++) {
//   var v = deserializer.deserialize(input);
//}
//console.log("right:"+v.name);
//var stop = Date.now(),
//  total = (stop - start) / 1000;
//
//console.log('Done in ' + total + 's, ', (limit / total).toFixed(3), 'documents / sec', (((size / total) / 1024) / 1024).toFixed(3), ' Mb / sec');
//});
//
//
//
//
