/*globals describe,it,before,beforeEach*/
'use strict';
describe('yaml tests', function() {
    it('should dump "initialize" correctly', function() {
        var init = {
            description: 'initializes the simulation',
            properties: [
                {fileName: {type: 'string'}}
            ],
            name: 'initialize',
            tags: []
        };

        console.log(yaml.dump(init));
    });
});
