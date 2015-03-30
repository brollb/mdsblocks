/*globals expect,before,describe,it,GithubLoader*/
'use strict';

var creds = {username: 'ElTester', password: 'password123'},
    owner = 'ElTester',
    project = 'octokatTest';

describe('Github Loader Tests', function() {
    var loader;

    before(function() {
        loader = new GithubLoader(creds);
    });

    describe('Basic Tests', function() {

        it('should contact Github', function(done) {
            loader._octo.zen.read(function(err, val) {
                console.log('value is'+val);
                console.assert(!!val && !err);
                done();
            });
        });

    });

    describe('MetaMDS Stuff', function() {
        it('should load in dependencies of a project', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                expect(loader.isProjectLoaded('ElTester/mdsP2')).toNotBe(false);
                done();
            });
        });

        it('should load in dependencies of a project recursively', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                expect(loader.isProjectLoaded('ElTester/mdsP4')).toNotBe(false);
                done();
            });
        });

        it('should store the concepts from a repo', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                console.log(loader.loadedConcepts.lj_pair);
                expect(loader.loadedConcepts.lj_pair).toNotBe(undefined);
                done();
            });
        });

        it.skip('should load blocks by first occurrence in "path"', function(done) {
        });

        it.skip('should load in dependencies of a project', function(done) {
        });

    });
});
