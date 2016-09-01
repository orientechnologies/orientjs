//
//path = require('path');
//global.LIB_ROOT = path.resolve(__dirname, '..', 'lib');
//
//global.LIB = require(LIB_ROOT);
//var deserializer = require(LIB_ROOT + '/transport/binary/protocol33/deserializer-binary');
//var fs = require('fs');
//
//fs.readFile('./test/content.bin',function(err,data){
//var limit = 1000000,
//  input = new Buffer(data,"binary"),
//  size = input.length * limit,
//  start = Date.now();
//console.log(typeof(input));
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
