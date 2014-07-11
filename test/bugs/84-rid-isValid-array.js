describe("Bug #84: Bug in RecordID.isValid with array input", function () {
  it('validate array input', function () {
    var input = ['#1:23', '#4:56', '#6:79'];
    LIB.RID.isValid(input).should.be.true;
  });
});