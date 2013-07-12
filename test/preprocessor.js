var preprocess = require('../cli').preprocess;
var expect = require('chai').expect;
var fs = require('fs');

// Allow non-mocha frameworks to skip over these tests.
if (!global.describe) { process.exit(); }

describe('preprocess', function() {

    it('should skip .sass partials', function(done) {
        preprocess('_test.sass', null, null, function(err, data) {
            expect(data).to.equal('');
            done(err);
        });
    });

    it('should skip .scss partials', function(done) {
        preprocess('_test.scss', null, null, function(err, data) {
            expect(data).to.equal('');
            done(err);
        });
    });

});
