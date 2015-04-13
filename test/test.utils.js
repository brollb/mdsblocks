/*globals expect,Utils,describe,it*/
'use strict';

describe('Utils testing', function() {
    describe('capitalize', function() {
        it('should capitalize words', function() {
            var phrase = 'i am a phrase',
                result;

            result = Utils.capitalize(phrase);

            expect(result[0]).toBe('I');
            expect(result.substring(1)).toBe(' am a phrase');
        });
    });

    describe('isYamlFile', function() {
        it('should not recognize .aml extension', function() {
            expect(Utils.isYamlFile('test.aml')).toNotBe(true);
        });

        it('should recognize .yaml extension', function() {
            expect(Utils.isYamlFile('test.yaml')).toBe(true);
        });

        it('should recognize .yml extension', function() {
            expect(Utils.isYamlFile('test.yml')).toBe(true);
        });

        it('should recognize files with extra .\'s', function() {
            expect(Utils.isYamlFile('test.test.yml')).toBe(true);
        });

        it('should recognize files with extra -\'s', function() {
            expect(Utils.isYamlFile('test-test.yml')).toBe(true);
        });
    });

    var createGithubUrlTests = function() {
        var githubUrls = {
            "https://github.com/ElTester/octokatTest": true, 
            "https://github.com/ElTester/mdsP2": true, 
            "https://github.com/ElTester/mdsP3": true,
            "../metamds-cli/concepts": false,
            "/opt/hoomd_local": false
            },
            urls = Object.keys(githubUrls),
            isGithubURL,
            url;

        return function() {
            for (var i = urls.length; i--;) {
                isGithubURL = githubUrls[urls[i]];
                url = urls[i];
                it('should '+(isGithubURL ? '' : 'not')+' recognize '+
                    url, function() {
                    expect(Utils.isGithubURL(url)).toBe(isGithubURL);
                });
            }
        };
            
    };

    describe('isGithubURL', createGithubUrlTests());

});
