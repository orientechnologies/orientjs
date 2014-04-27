var deserializer = require(LIB_ROOT + '/transport/binary/protocol/deserializer');

describe("Deserializer", function () {
  it('should go fast!', function () {
    var limit = 100000,
        input = 'OUser@foo:123,baz:"bazz\\"za",int: 1234,true:true,false:false,null:null,date:123456a,rid:#12:10',
        size = input.length * limit,
        start = Date.now();

    for (var i = 0; i < limit; i++) {
      deserializer.deserialize(input);
    }

    var stop = Date.now(),
        total = (stop - start) / 1000;

    console.log('Done in ' + total + 's, ', (limit / total).toFixed(3), 'documents / sec', (((size / total) / 1024) / 1024).toFixed(3), ' Mb / sec')
  });

  describe('deserialize()', function () {
    it('should parse a very simple record', function () {
      var input = 'OUser@foo:123,baz:"bazx\\"za",int:1234,true:true,false:false,null:null,date:123456a,rid:#12:10,array:[1,2,3,4,5],twice:"\\"127.0.0.1\\""';
      var parsed = deserializer.deserialize(input);
      parsed.should.eql({
        '@type': 'd',
        '@class': 'OUser',
        foo: 123,
        baz: 'bazx"za',
        int: 1234,
        true: true,
        false: false,
        null: null,
        date: new Date(123456),
        rid: new LIB.RID('#12:10'),
        array: [1, 2, 3, 4, 5],
        twice: '"127.0.0.1"'
      });
    });
  });
  describe('eatString()', function () {
    it('should eat a string', function () {
      var input = 'this is a string"';
      var parsed = deserializer.eatString(input);
      parsed[0].should.equal('this is a string');
      parsed[1].length.should.equal(0);
    });
    it('should eat a string which contains escaped double quotes', function () {
      var input = 'this \\"is\\" a string"';
      var parsed = deserializer.eatString(input);
      parsed[0].should.equal('this "is" a string');
      parsed[1].length.should.equal(0);
    });
  });
  describe('eatNumber()', function () {
    it('should eat an integer', function () {
      var input = '1234,';
      var parsed = deserializer.eatNumber(input);
      parsed[0].should.equal(1234);
      parsed[1].length.should.equal(1);
    });
    it('should eat a number with a decimal point', function () {
      var input = '1234.567,';
      var parsed = deserializer.eatNumber(input);
      parsed[0].should.equal(1234.567);
      parsed[1].length.should.equal(1);
    });
    it('should eat a float', function () {
      var input = '1234f';
      var parsed = deserializer.eatNumber(input);
      parsed[0].should.equal(1234);
      parsed[1].length.should.equal(0);
    });
    it('should eat a date', function () {
      var input = '1a';
      var parsed = deserializer.eatNumber(input);
      parsed[0].should.eql(new Date(1));
      parsed[1].length.should.equal(0);
    });
  });
  describe('eatRID()', function () {
    it('should eat a record id', function () {
      var input = '12:10';
      var parsed = deserializer.eatRID(input);
      parsed[0].toString().should.equal('#12:10');
      parsed[1].length.should.equal(0);
    });
    it('should eat a record id, with a trailing comma', function () {
      var input = '12:10,';
      var parsed = deserializer.eatRID(input);
      parsed[0].toString().should.equal('#12:10');
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatArray()', function () {
    it('should eat an array', function () {
      var input = '1,2,3]';
      var parsed = deserializer.eatArray(input);
      parsed[0].should.eql([1,2,3]);
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty array', function () {
      var input = ']';
      var parsed = deserializer.eatArray(input);
      parsed[0].should.eql([]);
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty array, with a trailing comma', function () {
      var input = '],';
      var parsed = deserializer.eatArray(input);
      parsed[0].should.eql([]);
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatSet()', function () {
    it('should eat a set', function () {
      var input = '1,2,3>';
      var parsed = deserializer.eatSet(input);
      parsed[0].should.eql([1,2,3]);
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty set', function () {
      var input = '>';
      var parsed = deserializer.eatSet(input);
      parsed[0].should.eql([]);
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty set, with a trailing comma', function () {
      var input = '>,';
      var parsed = deserializer.eatSet(input);
      parsed[0].should.eql([]);
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatMap()', function () {
    it('should eat a map', function () {
      var input = '"key":"value","key2":2,"null": null}';
      var parsed = deserializer.eatMap(input);
      parsed[0].should.eql({key: 'value', key2: 2, null: null});
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty map', function () {
      var input = '}';
      var parsed = deserializer.eatMap(input);
      parsed[0].should.eql({});
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty map, with a trailing comma', function () {
      var input = '},';
      var parsed = deserializer.eatMap(input);
      parsed[0].should.eql({});
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatRecord()', function () {
    it('should eat a record', function () {
      var input = 'key:"value",key2:2,null:)';
      var parsed = deserializer.eatRecord(input);
      parsed[0].should.eql({'@type': 'd', key: 'value', key2: 2, null: null});
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty record', function () {
      var input = ')';
      var parsed = deserializer.eatRecord(input);
      parsed[0].should.eql({'@type': 'd'});
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty record with a class name', function () {
      var input = 'foo@)';
      var parsed = deserializer.eatRecord(input);
      parsed[0].should.eql({
        '@type': 'd',
        '@class': 'foo'
      });
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty record, with a trailing comma', function () {
      var input = '),';
      var parsed = deserializer.eatRecord(input);
      parsed[0].should.eql({'@type': 'd'});
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatBag()', function () {
    it('should eat a RID bag', function () {
      var input = 'AQAAAAoACwAAAAAAAAACAAsAAAAAAAAAAQALAAAAAAAAAAoACwAAAAAAAAAJAAsAAAAAAAAACAALAAAAAAAAAAcACwAAAAAAAAAGAAsAAAAAAAAABQALAAAAAAAAAAQACwAAAAAAAAAD;';
      var parsed = deserializer.eatBag(input);
      parsed[0].should.be.an.instanceOf(LIB.Bag);
      parsed[0].size.should.equal(10);
      parsed[1].length.should.equal(0);
    });
    it('should eat a RID bag with a trailing comma', function () {
      var input = 'AQAAAAoACwAAAAAAAAACAAsAAAAAAAAAAQALAAAAAAAAAAoACwAAAAAAAAAJAAsAAAAAAAAACAALAAAAAAAAAAcACwAAAAAAAAAGAAsAAAAAAAAABQALAAAAAAAAAAQACwAAAAAAAAAD;,';
      var parsed = deserializer.eatBag(input);
      parsed[0].should.be.an.instanceOf(LIB.Bag);
      parsed[0].size.should.equal(10);
      parsed[1].length.should.equal(1);
    });
  });
  describe('eatBinary()', function () {
    it('should eat a binary field', function () {
      var input = new Buffer('Hello World', 'utf8');
      var parsed = deserializer.eatBinary(input.toString('base64') + '_');
      parsed[0].should.be.instanceOf(Buffer);
      parsed[0].should.eql(input);
      parsed[1].length.should.equal(0);
    });
    it('should eat an empty binary field', function () {
      var input = new Buffer('', 'utf8');
      var parsed = deserializer.eatBinary(input.toString('base64') + '_');
      parsed[0].should.be.instanceOf(Buffer);
      parsed[0].should.eql(input);
      parsed[1].length.should.equal(0);
    });
  });
  describe('eatKey', function () {
    it('should eat an unquoted key', function () {
      var input = 'mykey:123';
      var parsed = deserializer.eatKey(input);
      parsed[0].should.equal('mykey');
      parsed[1].length.should.equal(3);
    });

    it('should eat a quoted key', function () {
      var input = '"mykey":123';
      var parsed = deserializer.eatKey(input);
      parsed[0].should.equal('mykey');
      parsed[1].length.should.equal(3);
    });
  });
  describe('eatValue', function () {
    it('should eat a null value', function () {
      var input = ',';
      var parsed = deserializer.eatValue(input);
      expect(parsed[0]).to.equal(null);
      parsed[1].length.should.equal(1);
    });
    it('should eat a string value', function () {
      var input = '"foo bar"';
      var parsed = deserializer.eatValue(input);
      parsed[0].should.equal('foo bar');
      parsed[1].length.should.equal(0);
    });
  });
});