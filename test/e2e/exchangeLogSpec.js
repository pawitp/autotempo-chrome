var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

Object.defineProperty(
  protractor.promise.Promise.prototype,
  'should',
  Object.getOwnPropertyDescriptor(Object.prototype, 'should')
);

describe('Exchange Log', function() {
  it('should fetch and display appointments from Exchange');
  it('should log selected appointments to Tempo')
});
