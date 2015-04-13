/*globals R,ConceptLoader,expect,describe,it,before,MDSBlockCreator,beforeEach*/
'use strict';
describe('Block creator tests', function() {
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

            R.values(results).forEach(function(concept) {
                expect(typeof concept).toBe('object');
            });

        });

        it('should add name to concept json', function() {
            var input = loader.loadExampleConcepts(),
                results = blockCreator.cleanConceptInput(input);

            R.values(results).forEach(function(concept) {
                expect(concept.name).toNotBe(undefined);
            });

        });
    });

    describe('createGraph', function() {
        it('should return correct number of nodes', function() {
            var input = loader.loadExampleConcepts(),
                results = blockCreator.cleanConceptInput(input);

            console.log('results', results);
            R.values(results).forEach(function(concept) {
                expect(concept.name).toExist();
            });

            var nodes = blockCreator._createGraph(R.values(results));
            expect(nodes.length).toBe(Object.keys(input).length);
        });
        
        it('should return types for each node', function() {
            var input = loader.loadExampleConcepts(),
                results = R.values(blockCreator.cleanConceptInput(input));

            results.forEach(function(concept) {
                expect(concept.name).toNotBe(undefined);
            });

            var nodes = blockCreator._createGraph(results),
                primitiveTypes = ['string'];

            nodes.forEach(function(n) {
                n.forEach(function(d) {
                    expect(input[d] || primitiveTypes.indexOf(d)).toNotBe(undefined);
                });
            });
        });
    });

    describe('sortConcepts', function() {
        var input,
            results;

        beforeEach(function() {
            input = loader.loadExampleConcepts();
            results = R.values(blockCreator.cleanConceptInput(input));
        });

        // Helpers
        var containsString = function(searched, string) {
            return string.indexOf(searched) > -1;
        };

        it('should create a list with all previous elements', function() {
            var nodes = blockCreator._sortConcepts(results);
            expect(nodes.length).toBe(Object.keys(input).length);
        });

        it('should be sorted list', function() {
            var nodes = blockCreator._sortConcepts(results);

            // execute_simulator# should be before sim_user#
            var exec_nodes = nodes.filter(containsString.bind(null, 'execute_simulator'));
            exec_nodes.forEach(function(n) {
                var num = /\d+/.exec(n)[0];
                expect(nodes.indexOf('sim_user'+num)).toBeGreaterThan(nodes.indexOf(n));
            });
        });

        describe('createBlocks', function() {
            it.only('should be ordered', function() {
                blockCreator.createBlocks(input);
            });
        });
    });
});
