var Operation = require(LIB_ROOT + '/transport/binary/protocol19/operation');


describe('Operation', function () {
  beforeEach(function () {
    this.op = new Operation();
    this.op.writer = function () {
      this
      .writeByte(1)
      .writeInt(123)
      .writeString('Hello World!')
      .writeShort(5)
      .writeShort(2);
    };
    this.op.reader = function () {
      this
      .readByte('opCode')
      .readInt('num')
      .readString('greeting')
      .readShort('shorts')
      .readShort('total');
    }
  });
  describe('Operation::buffer()', function () {
    beforeEach(function () {
      this.buffer = this.op.buffer();
    });
    it('should create a buffer with the right length', function () {
      this.buffer.length.should.equal(
        1 + // command code
        4 + // integer
        4 + Buffer.byteLength('Hello World!') +
        2 + // shhort
        2 // short
      );
    });

    it('should contain the correct contents', function () {
      var expected = Buffer(25);
      expected[0] = 1;
      expected.writeInt32BE(123, 1);
      expected.writeInt32BE(12, 5);
      expected.write('Hello World!', 9);
      expected.writeInt16BE(5, 21)
      expected.writeInt16BE(2, 23)
      this.buffer.should.eql(expected);
    });
  });
  describe('Operation::consume()', function () {
    beforeEach(function () {
      this.buffer = this.op.buffer();
      this.op.reader();
      this.result = this.op.consume(this.buffer);
    });
    it('should return the correct operation status code', function () {
      this.result[0].should.equal(Operation.COMPLETE);
    });
    it('should return the number of bytes read', function () {
      this.result[1].should.equal(25);
    });
    it('should return the correctly assembled result', function () {
      this.result[2].should.eql({
        opCode: 1,
        num: 123,
        greeting: 'Hello World!',
        shorts: 5,
        total: 2
      });
    });
  });
  describe('Operation::consume() with arrays', function () {
    beforeEach(function () {
      this.op = new Operation();
      this.op.writer = function () {
        this
        .writeShort(2)
        .writeInt(1)
        .writeString('first item')
        .writeInt(2)
        .writeString('second item')
        .writeString('wat');
      };
      this.op.reader = function () {
        this
        .readShort('total')
        .readArray('items', function (data) {
          var items = [], i;
          for (i = 0; i < data.total; i++) {
            items.push(function () {
              this.readInt('id');
              this.readString('name');
            });
          }
          return items;
        })
        .readString('wat');
      }
      this.buffer = this.op.buffer();
      this.op.reader();
      this.result = this.op.consume(this.buffer);
    });
    it('should return the correct operation status code', function () {
      this.result[0].should.equal(Operation.COMPLETE);
    });
    it('should return the number of bytes read', function () {
      this.result[1].should.equal(46);
    });
    it('should return the correctly assembled result', function () {
      expect(this.result[2]).to.eql({
        total: 2,
        items: [
          {
            id: 1,
            name: 'first item'
          },
          {
            id: 2,
            name: 'second item'
          }
        ],
        wat: 'wat'
      });
    });
  });
  describe('Operation::consume() with exhausted buffers', function () {
    beforeEach(function () {
      this.first = new Buffer(5);
      this.first[0] = 1; // opode
      this.first.writeInt32BE(123, 1); // num
      this.last = new Buffer(26);
      this.last.writeInt32BE(12, 0); // string length
      this.last.write('Hello World!', 4); // string content
      this.last.writeInt16BE(5, 16); // shorts
      this.last.writeInt16BE(2, 18); // total
      this.last.writeInt32BE(2, 20); // extra string length
      this.last.write('ab', 24); // extra string content
      this.op.reader();
    });
    it("should return an incomplete response", function () {
      var result = this.op.consume(this.first);
      result[0].should.equal(Operation.READING);
      result[1].should.equal(5);
      result[2].should.eql({
        opCode: 1,
        num: 123
      });
    });
    it("should resume after encountering an incomplete response", function () {
      var result = this.op.consume(this.first);
      result[0].should.equal(Operation.READING);
      result[1].should.equal(5);
      result[2].should.eql({
        opCode: 1,
        num: 123
      });

      result = this.op.consume(this.last);
      result[0].should.equal(Operation.COMPLETE);
      result[1].should.equal(20);
      result[2].should.eql({
        opCode: 1,
        num: 123,
        greeting: 'Hello World!',
        shorts: 5,
        total: 2
      });
    });
  });
});