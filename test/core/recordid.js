describe('RecordID', function () {
  var rid = LIB.RID('#1:23');

  describe('RecordID::equals()', function () {
    it('should equal an identical record', function () {
      rid.equals(rid).should.be.true;
    });
    it('should equal a string representation of the record', function () {
      rid.equals("#1:23").should.be.true;
    });
    it('should not equal a different record', function () {
      rid.equals(LIB.RID("4:56")).should.be.false;
    });
    it('should not equal a string representation a different record', function () {
      rid.equals("4:56").should.be.false;
    });
    it('should equal an identical record expressed as a POJO', function () {
      rid.equals({cluster: 1, position: 23}).should.be.true;
    });
    it('should not equal a different record expressed as a POJO', function () {
      rid.equals({cluster: 4, position: 56}).should.be.false;
    });
    it('should not equal nonsense', function () {
      rid.equals(false).should.be.false;
      rid.equals("blah").should.be.false;
    })
  });
});