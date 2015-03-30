/*globals Utils,async,R,yaml,Octokat*/
/*
 * This is a concept loader which retrieves projects from Github. In doing so, it will also read in the manifest file (project.yaml) and determine meaningful things...
 */

(function(global) {
    'use strict';

    var manifestFileName = 'project.yaml';

    var GithubLoader = function(auth) {
        this._octo = new Octokat(auth);

        this._manifestFileName = 'project.yaml';  //Accessible for testing
        this.loadedConcepts = {};  // yaml files stored by id
    };

    /**
     * Load a Github project and all dependencies.
     *
     * @return {undefined}
     */
    GithubLoader.prototype.loadProject = function(url, callback) {
        this.loadedProjects = {};
        this._loadProject(this._cleanUrl(url), callback);
    };

    /**
     * Extract the OWNER/PROJECT string from a URL
     *
     * @param {String} url
     * @return {String} <owner>/<url>
     */
    GithubLoader.prototype._cleanUrl = function(url) {
        return url.split('github.com/').pop();
    };

    /**
     * Check if the project is loaded.
     *
     * @param {String} (clean) url
     * @return {Boolean} isLoaded?
     */
    GithubLoader.prototype.isProjectLoaded = function(url) {
        return !!this.loadedProjects[url];
    };

    /**
     * Internal project loading. 
     *
     * @return {undefined}
     */
    GithubLoader.prototype._loadProject = function(info, callback) {
        // Load the project
        var self = this,
            data = info.split('/'),
            owner = data.shift(),
            projectName = data.shift(),
            project = this._octo.repos(owner, projectName),
            manifest = project.contents(manifestFileName).read();

        // Record the project as loaded
        console.log('Loading '+info);
        this.loadedProjects[info] = true;

        // Retrieve the project.yaml file
        manifest.then(function(result) {
            var deps = yaml.load(result).path;
            self.loadedConcepts[Utils.removeFileExtension(manifestFileName)] = result;

            // Convert urls to project name and remove already loaded projects
            deps = R.map(self._cleanUrl, deps).filter(function(e) {
                return !self.isProjectLoaded(e);
            });

            // Filter deps by those that are not already loaded
            async.each(deps, function(info, callback) {
                return self._loadProject.call(self, info, callback);
                },
                function(err) {
                    // Load all blocks in the project!
                    // For each .yaml file in the root path, store it as a
                    // concept
                    self._octo.repos(owner, projectName).fetch(function(e, v) {
                        console.log('Fetched', v, 'for repo: '+owner+'/'+projectName);
                        v.contents('').read().then(function(res) {
                            var files = JSON.parse(res);
                            // Remove all non-yaml files
                            files = R.map(Utils.getAttribute('name'), files).filter(Utils.isYamlFile);
                            
                            // For each yaml file, store it w/o extname as loadedConcept
                            // Remove files that are already loaded
                            files = R.reject(function(e) {
                                var conceptName = Utils.removeFileExtension(e);
                                return !!self.loadedConcepts[conceptName];
                            }, files);

                            // Store remaining concepts
                            files.forEach(function(file) {
                                var contents = v.contents(file).read();
                                contents.then(function(result) {
                                    self.loadedConcepts[Utils.removeFileExtension(file)] = result;
                                });
                                
                            });
                        });
                    });
                    console.log('about to call the callback!');
                    callback(null);
            });
        });
    };

    GithubLoader.prototype._loadDependents = function(info, callback) {
    };

    global.GithubLoader = GithubLoader;

})(this);
