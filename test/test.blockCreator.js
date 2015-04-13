/*globals ConceptLoader,expect,describe,it,before,MDSBlockCreator,beforeEach*/
'use strict';
describe.only('Block creator tests', function() {
    var blockCreator,
        loader;

    beforeEach(function() {
        blockCreator = new MDSBlockCreator(/*toolbox*/);
        loader = new ConceptLoader();
    });

    describe('isMetaConcept', function() {
        it('should detect meta concept', function() {
            var concept = {description: 1, properties:1};
            expect(blockCreator.isMetaConcept(concept)).toBe(true);
        });

        it('should detect instance concept', function() {
            var concept = {description: 1};
            expect(blockCreator.isMetaConcept(concept)).toBe(false);
        });
    });

    describe('cleanConceptInput', function() {
        it('should create json from yaml input', function() {
            var input = loader.loadExampleConcepts(),
                results = blockCreator.cleanConceptInput(input);

            results.forEach(function(concept) {
                expect(typeof concept).toBe('object');
            });

            console.log('results:', results[0]);
        });

        it('should add name to concept json', function() {
            var input = loader.loadExampleConcepts(),
                results = blockCreator.cleanConceptInput(input);

            results.forEach(function(concept) {
                expect(concept.name).toNotBe(undefined);
            });

            var nodes = blockCreator._sortConcepts(results);
        });
    });

    describe('createGraph', function() {
        
        
    });

});
