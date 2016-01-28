/*globals Utils,async,R,yaml,Octokat*/
/*
 * This is a concept loader which retrieves projects from Github. In doing so, it will also read in the manifest file (project.yaml) and determine meaningful things...
 */

(function(global) {
    'use strict';

    var MANIFEST_FILE = 'online_project.yaml',
        CONCEPT_KEY = 'concept_path',
        CODE_KEY = 'code_path';

    var GithubLoader = function(auth) {
        this._octo = null;
        this._manifestFileName = MANIFEST_FILE;  // Accessible for testing

        this.login(auth);
    };
    
    GithubLoader.prototype.login = function(auth) {
        console.log('authenticating with:', auth);
        this._octo = new Octokat(auth);
        this.loggedIn = true;
        this.initialize();
    };

    GithubLoader.prototype.logout = function() {
        this._octo = new Octokat();
        this.loggedIn = false;
        this.initialize();
    };

    /**
     * Initialize the current project.
     *
     * @return {undefined}
     */
    GithubLoader.prototype.initialize = function() {
        this.currentProject = null;
        this.currentRepo = null;
        this.projectConcepts = [];
        this.loadedConcepts = {};  // yaml files stored by id
        this.loadedProjects = {};

        // Priority of concepts. Contains a lexical numbering where 
        // 
        //     1.2.10.3 
        //
        // is the 1st dependency's 2nd dependency's 10th dependency's 3rd dependency
        this._repoPriority = {};
    };

    /**
     * Load a Github project and all dependencies.
     *
     * @return {undefined}
     */
    GithubLoader.prototype.loadProject = function(url, callback) {
        this.initialize();

            this.currentProject = this._cleanUrl(url).toLowerCase();
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
        if (this.loggedIn) {
            this._saveToPath(files.instances, 'code/');
            this._saveToPath(files.concepts, 'concepts/');
        } else {
            console.error('Not logged in. Please log in before saving a project.');
        }
    };

    GithubLoader.prototype._saveToPath = function(files, path) {
        var pairs = R.toPairs(files);
        pairs.forEach(function(p) {
            p.unshift(path);
            this.saveConcept.apply(this, p);
        }, this);
    };

    GithubLoader.prototype.saveConcept = function(path, name, content) {
        var msg = (this.loadedConcepts[name] ? 'Modified ' : 'Created ') +
                name+' with MDS Editor',
            concept = this._getUpdatedConcept(name, content, path),
            config = {
                message: msg,
                content: Utils.to64bitString(content),
                sha: concept.sha
            };

        this.currentRepo.contents(concept.path).add(config)
            .then(function(info) {
                console.log('Updating '+name);
                concept.sha = info.commit.sha;
            });
    };

    GithubLoader.prototype._getUpdatedConcept = function(name, content, path) {
        if (!this.loadedConcepts[name]) {
            if (!Utils.isYamlFile(name)) {
                name += '.yaml';
            }
            this.loadedConcepts[name] = {
                path: path+name,
                origin: this.currentRepo.fullName,
                name: name
            };
        }

        this.loadedConcepts[name].content = content;
        return this.loadedConcepts[name];
    };

    /**
     * Extract the <owner>/<project>/<path> string from a URL
     *
     * @param {String} url
     * @return {String} <owner>/<url>
     */
    GithubLoader.prototype._cleanUrl = function(url) {
        url = url.split('github.com/').pop();

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
        var isProjectManifest = R.partial(R.eq, Utils.removeFileExtension(MANIFEST_FILE)),
            conceptFilter = R.pipe(R.nthArg(1), Utils.not(isProjectManifest)),
            rawConcepts = R.pickBy(conceptFilter, this.loadedConcepts);

        return R.mapObj(R.partialRight(Utils.getAttribute, 'content'), rawConcepts);
    };

    /**
     * Internal project loading. 
     *
     * @param {Repo} parent of the requested project
     * @param {String} Github project id
     * @param {Function} callback
     * @return {undefined}
     */
    GithubLoader.prototype._loadProject = function(info, callback) {
        // Load the project
        var data = info.split('/'),
            owner = data.shift(),
            projectName = data.shift(),
            ref = 'master',  // data.shift(),
            path = data.join('/'),
            project = this._octo.repos(owner, projectName).fetch();

        // Record the project as loaded
        console.log('Loading ' + path + ' from ' + projectName + ' (' + owner + ')');

        project.then(function(repo) {
            if ((repo.fullName+'/'+path).toLowerCase() === this.currentProject) {
                this.currentRepo = repo;
                this._repoPriority[repo.fullName] = '0';
            }

            this.loadedProjects[info] = true;

            // Retrieve the project.yaml file
            this._getDependencies(repo, path, function(deps) {
                // Convert urls to project name and remove already loaded projects
                deps = R.map(this._cleanUrl, deps)
                    .filter(Utils.not(this.isProjectLoaded.bind(this)));

                this._recordPriorities(repo, deps);

                // Load all dependencies in parallel
                async.each(deps, 
                    this._loadProject.bind(this),  // Load the dependency
                    // Store the concepts next
                    this._loadProjectConcepts.bind(this, owner, projectName, ref, path, callback));

            }.bind(this));
        }.bind(this));
    };

    GithubLoader.prototype._getDependencies = function(repo, path, cb) {
        var manifestPath = path + '/' + MANIFEST_FILE,
            contents = repo.contents(manifestPath).read();

        // Read the file
        contents.then(function(result) {
            var deps = yaml.load(result.content)[CONCEPT_KEY] || [],
                codePaths = yaml.load(result.content)[CODE_KEY] || [];

            // Remove non-Github paths
            deps = deps.concat(codePaths)
                .filter(Utils.isGithubURL);

            cb(deps);
        })
        // If the manifest doesn't exist, assume no dependencies
        .catch(function(err) {
            cb([]);
        });
    };

    GithubLoader.prototype._getRepo = function(info, cb) {
        var data = info.split('/'),
            owner = data.shift(),
            projectName = data.shift(),
            branch = data.shift(),
            path = data.join('/'),
            project = this._octo.repos(owner, projectName),
            manifest = project.contents(MANIFEST_FILE).read();

        // Record the project as loaded
        console.log('Loading '+info);

        project.fetch(cb);
    };

    GithubLoader.prototype._isPriorTo = function(r1, r2) {
        var order1 = this._repoPriority[r1].split('.'),
            order2 = this._repoPriority[r2].split('.'),
            n1,
            n2,
            len = Math.min(order1.length, order2.length);

        for (var i = 1; i < len; i++) {
            // Compare each number
            n1 = parseInt(order1[i]);
            n2 = parseInt(order2[i]);
            if (n1 !== n2) {
                return n1 < n2;
            }
        }

        return order1.length < order2.length;
    };

    GithubLoader.prototype._recordPriorities = function(parent, deps, callback) {
        // Set the project's priority
        var parentPriority = this._repoPriority[parent.fullName] || '';

        async.each(deps, function(dep, cb) {
            this._getRepo(dep, function(e, repo) {
                if (e) {
                    throw e;
                }
                var num = deps.indexOf(dep);
                this._repoPriority[repo.fullName] = parentPriority+'.'+num;
            }.bind(this));
        }.bind(this), callback);
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
    GithubLoader.prototype._loadProjectConcepts = function(owner, projectName, ref, path, callback, err) {
        // Load all blocks in the project!
        // For each .yaml file in the root path, store it as a
        // concept
        if (err) {
            return console.error('Could not dependencies of '+owner+'/'+projectName+':', err);
        }

        this._octo.repos(owner, projectName).fetch({ref: ref || 'master'})
            .then(function(repo) {
            console.log('About to read path:', path);

            // Get the contents
            this._loadConcepts(repo, ref, path, callback);
        }.bind(this));
    };

    GithubLoader.prototype._loadConcepts = function(repo, ref, path, callback) {
        this._loadAllFiles(repo, ref, path, function(err, files) {
            if (err) {
                return console.error('Could not load files:', err);
            }

            files = this._getRelevantFiles(files);

            // Store remaining concepts
            async.each(files, this._storeConcept.bind(this, repo), callback);
        }.bind(this));
    };

    GithubLoader.prototype._loadAllFiles = function(repo, ref, path, callback) {
        var isDir = R.pipe(
                R.partialRight(Utils.getAttribute, 'type'),
                R.partial(R.eq, 'dir')
            ),
            loadDir = this._loadAllFiles.bind(this, repo, ref);

        repo.contents(path).fetch({ref: ref}).then(function(files) {

            var dirs = Utils.extract(isDir, files),
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
            concept.origin = repo.fullName;
            // If the concept already exists, check if the current concept path is
            // earlier than the other concepts path
            // TODO
            var name = Utils.removeFileExtension(concept.name);
            if (!this.loadedConcepts[name] || // Not loaded or has precedence
                this._isPriorTo(concept.origin, this.loadedConcepts[name].origin)) {

                this.loadedConcepts[name] = concept;
            }

            // Store project concepts
            if (this.currentRepo && this.currentRepo.fullName === repo.fullName) {
                this.projectConcepts.push(Utils.removeFileExtension(concept.name));
            }
            callback(null, concept);
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
        return /*R.reject(this._isConceptLoaded.bind(this), */files;/*);*/
    };

    global.GithubLoader = GithubLoader;

})(this);
