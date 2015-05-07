/*globals R,yaml,expect,Utils,describe,it*/
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

    describe('not', function() {
        it('should return a function', function() {
            expect(typeof Utils.not(console.log)).toBe('function');
        });

        it('should negate the given function', function() {
            var isOdd = R.modulo(R.__, 2),
                isEven = Utils.not(isOdd);

            expect(isEven(2)).toBe(true);
        });
    });

    describe('extract', function() {

        it('should extract the odds from a list', function() {
            var list = [1,2,3,4,5,6],
            isOdd = R.modulo(R.__, 2),
            odds;

            odds = Utils.extract(isOdd, list);

            // check that list is all odds
            expect(R.all(Utils.not(isOdd))(list)).toBe(true);

            // check that evens is all evens
            expect(R.all(isOdd)(odds)).toBe(true);
        });
    });

    describe('isMetaConcept', function() {
        it('should detect meta concept', function() {
            var concept = {description: 1, properties:1};
            expect(Utils.isMetaConcept(concept)).toBe(true);
        });

        it('should detect instance concept', function() {
            var concept = {description: 1};
            expect(Utils.isMetaConcept(concept)).toBe(false);
        });
    });

    describe('yamlListToArray', function() {
            var example = "load:\n  file_name: '{{file_name}}'\nlj_pair:\n  r_cut: 2.5\n  atom_type_1: 'A'\n  atom_type_2: 'A'\n  epsilon: 1\n  sigma: 1\nlj_pair:\n  r_cut: 2.5\n  atom_type_1: 'A'\n  atom_type_2: 'B'\n  epsilon: 1\n  sigma: 1\nlj_pair:\n  r_cut: 2.5\n  atom_type_1: 'B'\n  atom_type_2: 'B'\n  epsilon: 1\n  sigma: 1\n";
        it('should create correct sized yaml array from example list', function() {
            var result = Utils.yamlListToArray(example);
            expect(yaml.load(result).length).toBe(4);
        });

        it('should contain the same values as example list', function() {
            var counts = {load: 1, lj_pair: 3},
                result = yaml.load(Utils.yamlListToArray(example)),
                names = result.map(function(r) {return Object.keys(r).pop();}),
                index;

            for (var name in counts) {
                while (counts[name]) {
                    index = names.indexOf(name);
                    expect(index).toNotBe(-1);
                    names.splice(index,1);
                    counts[name]--;
                }
            }
            expect(names.length).toBe(0);
        });

        it('should support indented lists', function() {
            var indentedExample = "  load:\n    file_name: '{{file_name}}'\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'A'\n    atom_type_2: 'A'\n    epsilon: 1\n    sigma: 1\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'A'\n    atom_type_2: 'B'\n    epsilon: 1\n    sigma: 1\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'B'\n    atom_type_2: 'B'\n    epsilon: 1\n    sigma: 1\n",
                counts = {load: 1, lj_pair: 3},
                result = yaml.load(Utils.yamlListToArray(indentedExample)),
                names = result.map(function(r) {return Object.keys(r).pop();}),
                index;

            for (var name in counts) {
                while (counts[name]) {
                    index = names.indexOf(name);
                    expect(index).toNotBe(-1);
                    names.splice(index,1);
                    counts[name]--;
                }
            }
            expect(names.length).toBe(0);
        });

        it('should insert "- " after the indentation', function() {
            var indentedExample = "  load:\n    file_name: '{{file_name}}'\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'A'\n    atom_type_2: 'A'\n    epsilon: 1\n    sigma: 1\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'A'\n    atom_type_2: 'B'\n    epsilon: 1\n    sigma: 1\n  lj_pair:\n    r_cut: 2.5\n    atom_type_1: 'B'\n    atom_type_2: 'B'\n    epsilon: 1\n    sigma: 1\n",
                counts = {load: 1, lj_pair: 3},
                result = Utils.yamlListToArray(indentedExample),
                reg = /^\s*- \w+.*/;

            expect(reg.test(result)).toBe(true);
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

    describe('removesDuplicates', function() {
        it('should contain "a" with ["a","a","b"]', function() {
            var res = Utils.removeDuplicates(['a','a','b']);
            expect(res.indexOf("a")).toNotBe(-1);
        });

        it('should contain "b" with ["a","a","b"]', function() {
            var res = Utils.removeDuplicates(['a','a','b']);
            expect(res.indexOf('b')).toNotBe(-1);
        });

        it('should return list of size 2 with ["a","a","b"]', function() {
            var res = Utils.removeDuplicates(['a','a','b']);
            expect(res.length).toBe(2);
        });

        it('should contain "a","b" with ["a","b"]', function() {
            var res = Utils.removeDuplicates(['a','b']);
            expect(res.length).toBe(2);
            expect(res.indexOf('b')).toNotBe(-1);
            expect(res.indexOf('a')).toNotBe(-1);
        });
    });

    describe('hasSameStructure', function() {
        it('should return true for same object', function() {
            var obj = {a: 1, b:2},
                res = Utils.haveSameStructure(obj, obj);

            expect(res).toBe(true);
        });

        it('should return false if keys differ', function() {
            var obj1 = {a: 1, b:2},
                obj2 = {c: 1, b:2},
                res = Utils.haveSameStructure(obj1, obj2);

            expect(res).toBe(false);
        });

        it('should return true even when values differ', function() {
            var obj1 = {a: 1, b:2},
                obj2 = {a: 7, b:2},
                res = Utils.haveSameStructure(obj1, obj2);

            expect(res).toBe(true);
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
