/*globals expect,before,describe,it,GithubLoader*/
'use strict';

var owner = 'ElTester',
    project = 'octokatTest',
    oauth = 'db536deb6c4d8a9ae48a936be26d79e4839e9515',
    myCreds = {token: oauth},
    creds = {username: 'ElTester', password: 'password123'};

describe('Github Loader Tests', function() {
    var loader;

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

        it.skip('should store blocks by project', function(done) {
        });

        it.skip('should load blocks by first occurrence in "path"', function(done) {
        });
    };

    describe('Using OAuth', function() {
        before(function() {
            loader = new GithubLoader(myCreds);
        });

        testGithubFn();
    });
    describe('Using username/password', function() {
        before(function() {
            loader = new GithubLoader(creds);
        });

        testGithubFn();
    });
});
