/*globals Utils,async,R,yaml,Octokat*/
/*
 * This is a concept loader which retrieves projects from Github. In doing so, it will also read in the manifest file (project.yaml) and determine meaningful things...
 */

(function(global) {
    'use strict';

    var manifestFileName = 'project.yaml';

    var GithubLoader = function(auth) {
        this._octo = new Octokat(auth);

        this.currentProject = null;
        this.currentRepo = null;
        this.projectConcepts = [];
        this._manifestFileName = 'project.yaml';  // Accessible for testing
        this.loadedConcepts = {};  // yaml files stored by id
    };

    /**
     * Load a Github project and all dependencies.
     *
     * @return {undefined}
     */
    GithubLoader.prototype.loadProject = function(url, callback) {
        this.loadedProjects = {};
        this.currentProject = this._cleanUrl(url);
        this._loadProject(this.currentProject, callback);
    };

    /**
     * Save the files to the given project.
     *
     * @param {Github URL} url
     * @param {Dictionary<Name, Content>} files
     * @return {undefined}
     */
    GithubLoader.prototype.saveProject = function(files) {
        var pairs = R.toPairs(files);
        pairs.forEach(function(p) {
            this.saveConcept.apply(this, p);
        }, this);
    };

    GithubLoader.prototype.saveConcept = function(name, content) {
        var concept = this._getUpdatedConcept(name, content),
            config = {
            message: 'Modified '+name+' with MDS Editor',
            content: Utils.to64bitString(content),
            sha: concept.sha
        };

        this.currentRepo.contents(concept.path).add(config)
            .then(function(info) {
                console.log('Updating '+name);
                concept.sha = info.commit.sha;
            });
    };

    GithubLoader.prototype._getUpdatedConcept = function(name, content) {
        if (!this.loadedConcepts[name]) {
            if (!Utils.isYamlFile(name)) {
                name += '.yaml';
            }
            this.loadedConcepts[name] = {
                path: 'code/'+name,
                name: name
            };
        }

        this.loadedConcepts[name].content = content;
        return this.loadedConcepts[name];
    };

    /**
     * Extract the <owner>/<project>/<branch> string from a URL
     *
     * @param {String} url
     * @return {String} <owner>/<url>
     */
    GithubLoader.prototype._cleanUrl = function(url) {
        url = url.split('github.com/').pop();

        if (/[\w\-_]+\/[\w\-_]+\/tree/.test(url)) {
            url = url.split('/tree').join('');  // Remove '/tree'
        } else {
            url += '/master';  // Assume master branch by default
        }

        return url;
    };

    /**
     * Check if the project is loaded.
     *
     * @param {String} (clean) url
     * @return {Boolean} isLoaded?
     */
    GithubLoader.prototype.isProjectLoaded = function(url) {
        // Add branch to url if needed (assuming master)
        if (url.split('/').length === 2) {
            url += '/master';
        }

        return !!this.loadedProjects[url];
    };

    /**
     * Get the concepts currently loaded.
     *
     * @return {Dictionary<Concept>}
     */
    GithubLoader.prototype.getConcepts = function() {
        var isProjectManifest = R.partial(R.eq, Utils.removeFileExtension(manifestFileName)),
            conceptFilter = R.pipe(R.nthArg(1), Utils.not(isProjectManifest)),
            rawConcepts = R.pickBy(conceptFilter, this.loadedConcepts);

        return R.mapObj(R.partialRight(Utils.getAttribute, 'content'), rawConcepts);
    };

    /**
     * Internal project loading. 
     *
     * @return {undefined}
     */
    GithubLoader.prototype._loadProject = function(info, callback) {
        // Load the project
        var data = info.split('/'),
            owner = data.shift(),
            projectName = data.shift(),
            branch = data.shift(),
            path = data.join('/'),
            project = this._octo.repos(owner, projectName),
            manifest = project.contents(manifestFileName).read();

        // Record the project as loaded
        console.log('Loading '+info);
        project.fetch(function(e, repo) {
            if (repo.fullName+'/'+branch === this.currentProject) {
                this.currentRepo = repo;
            }

            this.loadedProjects[info] = true;

            // Retrieve the project.yaml file
            manifest.then(function(result) {
                var deps = yaml.load(result).path || [];
                this.loadedConcepts[Utils.removeFileExtension(manifestFileName)] = result;

                // Remove non-Github paths
                deps = deps.filter(Utils.isGithubURL);

                // Convert urls to project name and remove already loaded projects
                deps = R.map(this._cleanUrl, deps)
                .filter(Utils.not(this.isProjectLoaded.bind(this)));

                // Load all dependencies in parallel
                async.each(deps, 
                    this._loadProject.bind(this),  // Load the dependency
                    // Store the concepts next
                    this._loadProjectConcepts.bind(this, owner, projectName, path, callback));
            }.bind(this));
        }.bind(this));
    };

    GithubLoader.prototype._isConceptLoaded = function(concept) {
        var getName = R.partialRight(Utils.getAttribute, 'name');
        return R.pipe(getName, // Get the concept's name
                Utils.removeFileExtension,   // Remove .yaml
                R.partialRight(R.has, this.loadedConcepts))  // Check if this.loadedConcepts has it
                (concept);  // Call the composed function
    };

    // If it is the current project, load all the concepts (recursively)
    // Otherwise, load root directory and the concepts directory
    // TODO
    GithubLoader.prototype._loadProjectConcepts = function(owner, projectName, path, callback, err) {
        // Load all blocks in the project!
        // For each .yaml file in the root path, store it as a
        // concept
        if (err) {
            return console.error('Could not dependencies of '+owner+'/'+projectName+':', err);
        }

        this._octo.repos(owner, projectName).fetch(function(e, repo) {
            console.log('About to read path:', path);

            // Get the contents
            this._loadConcepts(repo, path, callback);
        }.bind(this));
    };

    GithubLoader.prototype._loadConcepts = function(repo, path, callback) {
        this._loadAllFiles(repo, path, function(err, files) {
            if (err) {
                return console.error('Could not load files:', err);
            }

            files = this._getRelevantFiles(files);

            // Store remaining concepts
            async.each(files, this._storeConcept.bind(this, repo), callback);
        }.bind(this));
    };

    GithubLoader.prototype._loadAllFiles = function(repo, path, callback) {
        var isDir = R.pipe(
                R.partialRight(Utils.getAttribute, 'type'),
                R.partial(R.eq, 'dir')
            ),
            loadDir = this._loadAllFiles.bind(this, repo);

        repo.contents(path).read().then(function(res) {

            var files = JSON.parse(res),
                dirs = Utils.extract(isDir, files),
                dirPaths = R.map(R.partialRight(Utils.getAttribute, 'path'), dirs);

            // Load the directories..
            async.map(dirPaths, loadDir, function(err, results) {
                if (err) {
                    callback(err);
                }
                return callback(null, R.flatten(results).concat(files));
            });

        }.bind(this));
    };

    /**
     * Store the concept
     *
     * @param concept
     * @return {undefined}
     */
    GithubLoader.prototype._storeConcept = function(repo, concept, callback) {
        var contents = repo.contents(concept.path).read();

        contents.then(function(result) {
            concept.content = result;
            this.loadedConcepts[Utils.removeFileExtension(concept.name)] = concept;
            if (this.currentRepo.fullName === repo.fullName) {
                this.projectConcepts.push(Utils.removeFileExtension(concept.name));
            }
            callback(null);
        }.bind(this));
    };

    /**
     * Remove files that are already loaded or not yaml files
     *
     * @param {Array<File>} files
     * @return {Array<File>}
     */
    GithubLoader.prototype._getRelevantFiles = function(files) {
        // Remove non-yaml
        files = R.filter(R.pipe(
            R.partialRight(Utils.getAttribute,'name'), Utils.isYamlFile), files);

        // Remove files that are already loaded
        return R.reject(this._isConceptLoaded.bind(this), files);
    };

    global.GithubLoader = GithubLoader;

})(this);
