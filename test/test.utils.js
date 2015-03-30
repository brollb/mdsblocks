/*globals Utils,describe,it*/
'use strict';

describe('Utils testing', function() {
    describe('capitalize', function() {
        it('should capitalize words', function() {
            var phrase = 'i am a phrase',
                result;

            result = Utils.capitalize(phrase);

            console.assert(result[0] === 'I');
            console.assert(result.substring(1) === ' am a phrase');
        });
    });
});
