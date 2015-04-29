/*globals beforeEach,OAUTH_TOKEN,expect,before,describe,it,GithubLoader*/
'use strict';

var owner = 'ElTester',
    project = 'octokatTest',
    myCreds = {token: OAUTH_TOKEN},
    creds = {username: 'ElTester', password: 'password123'};

describe('Github Loader Tests', function() {

    var loader;

    describe('Basic Tests', function() {
        before(function() {
            loader = new GithubLoader(myCreds);
        });
        describe('getConcepts', function() {
            beforeEach(function() {
                loader.loadedConcepts = {
                    project: 'manifest file',
                    simulations: 1,
                    lj_pair: 2
                };
            });

            it('should not return the project manifest file', function() {
                var results = loader.getConcepts();
                console.log('results:', results);
                expect(results.project).toNotExist();
            });

            it('should return the other files', function() {
                var results = loader.getConcepts();
                expect(results.simulations).toExist();
                expect(results.lj_pair).toExist();
            });
        });
    });

    var testGithubFn = function() {

        it('should contact Github', function(done) {
            loader._octo.zen.read(function(err, val) {
                console.assert(!!val && !err);
                done();
            });
        });

        it('should read manifest from github', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                expect(loader.loadedConcepts.project).toNotBe(undefined);
                done();
            });
        });

        it('should not return manifest as a concept', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                console.log('asdfasdf',loader.getConcepts());
                expect(loader.getConcepts().indexOf('project')).toBe(-1);
                done();
            });
        });

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

                expect(loader.loadedConcepts.lj_pair).toNotBe(undefined);
                done();
            });
        });

        it('should store concepts of dependents', function(done) {
            loader.loadProject('https://github.com/ElTester/octokatTest', function(err) {
                expect(err).toBe(null);

                expect(loader.loadedConcepts.simulation).toNotBe(undefined);
                done();
            });
        });

        it('should load project w/ no dependents', function(done) {
            loader.loadProject('https://github.com/ElTester/mdsP5', function(err) {
                expect(err).toBe(null);

                expect(loader.loadedConcepts.lj_pair).toNotBe(undefined);
                done();
            });
        });

        it('should support dir paths with github url', function(done) {
            loader.loadProject('https://github.com/ElTester/mdsP3/tree/master/testDir', function(err) {
                expect(err).toBe(null);

                expect(loader.loadedConcepts.lj_pair).toNotBe(undefined);
                expect(loader.loadedConcepts.skip_me).toBe(undefined);
                done();
            });
        });

        it.skip('should store blocks by project', function(done) {
        });

        it.skip('should load blocks by first occurrence in "path"', function(done) {
        });

    };

    describe('Using OAuth', function() {
        before(function() {
            loader = new GithubLoader(myCreds);
        });

        //testGithubFn();

        describe('Additional issues/testing', function() {
            // retrieve iModelsP1
            it('should load metamds-p1', function(done) {
                loader.loadProject('https://github.com/iModels/metamds-p1', function(e) {
                    expect(e).toNotExist();
                    console.log('Loaded!');
                    done();
                });
            });

        });
    });

    describe('Using username/password', function() {
        before(function() {
            loader = new GithubLoader(creds);
        });

        testGithubFn();

        it.only('should support saving project to github', function() {
            var url = 'https://github.com/ElTester/writeTest';
            loader.loadProject(url, function(e) {
                loader.saveProject(url, files);
            });
        });
    });

});
