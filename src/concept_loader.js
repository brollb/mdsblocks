/*globals yaml*/
// Load the concepts currently, it is just a yaml file...
(function(global) {
    'use strict';
    var ConceptLoader = function() {
    };

    ConceptLoader.prototype.loadExampleConcept = function() {
        var yamlFile = 
        'description: "execute a simulation"\n'+
            'properties:\n'+
            '  target:\n'+
            '      type: string\n'+
            '      description: "target simulator"\n'+
            '  simulation_script_file_name:\n'+
            '      type: string\n'+
            '      description: "name of the file into which the simulation script will be saved"\n'+
            '  simulator_executable:\n'+
            '      type: string\n'+
            'required: [target, simulation_script_file_name, simulator_executable]';
        return {name: 'execute_simulator', content: yaml.load(yamlFile)};
    };

    global.ConceptLoader = ConceptLoader;
})(this);
