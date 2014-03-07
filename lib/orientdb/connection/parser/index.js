['../protocol', 'compatability', 'config-parser'].forEach(function (name) {
  var source = require('./' + name),
      keys = Object.keys(source),
      total = keys.length,
      key, i;
  for (i = 0; i < total; i++) {
    key = keys[i];
    exports[key] = source[key];
  }
});
