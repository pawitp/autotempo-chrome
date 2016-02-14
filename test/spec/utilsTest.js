/*jshint expr: true*/
(function() {
  'use strict';

  describe('utils', function() {

    var utils;

    beforeEach(module('utils'));

    beforeEach(inject(function($injector) {
      utils = $injector.get('utils');
    }));

    describe('secondsToHours', function() {
      describe('should convert seconds to hours by dividing 3600', function() {
        var data = [
          [3600, 1],
          [7200, 2],
          [1800, 0.5],
          [900, 0.25]
        ];

        data.forEach(function(data) {
          it('should return ' + data[1] + ' hours for ' + data[0] + ' seconds', function() {
            utils.secondsToHours(data[0]).should.equal(data[1]);
          });
        });
      });
    });

    describe('hoursToSeconds', function() {
      describe('should convert hours to second rounded to the nearest minute', function() {
        var data = [
          [1, 3600], // 1 hour
          [2, 7200], // 2 hours
          [0.5, 1800], // 30 minutes
          [0.25, 900], // 15 minutes
          [0.33, 1200], // 20 minutes
          [0.66, 2400], // 40 minutes
          [0.67, 2400], // 40 minutes
          [0.17, 600], // 10 minutes
          [1.33, 4800] // 1 hour 20 minutes
        ];

        data.forEach(function(data) {
          it('should return ' + data[1] + ' seconds for ' + data[0] + ' hours', function() {
            utils.hoursToSeconds(data[0]).should.equal(data[1]);
          });
        });
      });

      it('should have a valid 2 decimal point precision hour representation for all minutes', function() {
        var seconds = [];
        for (var hours = 0; hours <= 1.001; hours += 0.01) {
          seconds.push(utils.hoursToSeconds(hours));
        }

        for (var minutes = 0; minutes <= 60; minutes++) {
          seconds.should.contain(minutes * 60);
        }
      });
    });

    describe('isSameDay', function() {
      it('should return true for same day', function() {
        var date1 = new Date("2015-01-02");
        var date2 = new Date("2015-01-02");

        utils.isSameDay(date1, date2).should.be.true;
      });
      it('should return false for differnet days', function() {
        var date1 = new Date("2015-01-02");
        var date2 = new Date("2015-02-02");

        utils.isSameDay(date1, date2).should.be.false;
      });
    });

  });

})();
