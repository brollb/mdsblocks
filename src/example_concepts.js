var testFiles = ['description: "runs the simulation with a specified number of steps"\n'+
'type: statement\n'+
'properties:\n'+
'  num_steps:\n'+
'      type: number\n'+
'required: [ num_steps ]\n'+
'\n'+'',
'description: "list of statements"\n'+
'type: statement\n'+
'properties:\n'+
'  statements:\n'+
'      description: list of statements\n'+
'      type: list\n'+
'      items:\n'+
'        type: statement\n'+
'      minItems: 1\n'+
'required: [ statements ]\n'+
'\n'+'',
'description: "a block representing a simulation script"\n'+
'properties:\n'+
'  target:\n'+
'      type: string\n'+
'      description: "target simulator"\n'+
'  simulation_script_file_name:\n'+
'      type: string\n'+
'      description: "name of the file into which the simulation script will be saved"\n'+
'  statements:\n'+
'      description: "list of statements"\n'+
'      type: list\n'+
'required: [target, simulation_script_file_name, statements]\n'+
'\n'+'',
'description: "loads an input file"\n'+
'properties:\n'+
'  file_name:\n'+
'      type: string\n'+
'required: [file_name]\n'+'',
'description: "a blocl representing a simulation"\n'+
'properties:\n'+
'  target:\n'+
'      type: string\n'+
'      description: "target simulator"\n'+
'  simulation_script_file_name:\n'+
'      type: string\n'+
'      description: "name of the file into which the simulation script will be saved"\n'+
'  simulator_executable:\n'+
'      type: string\n'+
'  statements:\n'+
'      description: "list of statements"\n'+
'      type: list\n'+
'required: [target, simulation_script_file_name, simulator_executable, statements]\n'+
'\n'+'',
'description: "initializes the simulation"\n'+
'properties:\n'+
'  - fileName:\n'+
'      type: string\n'+
'\n'+'',
'description: "define a LJ pair interaction"\n'+
'properties:\n'+
'  r_cut:\n'+
'      description: "cutoff"\n'+
'      type: number\n'+
'  atom_type_1:\n'+
'      description: "type of atom #1"\n'+
'      type: string\n'+
'  atom_type_2:\n'+
'      description: "type of atom #2"\n'+
'      type: string\n'+
'  epsilon:\n'+
'      description: "epsilon parameter"\n'+
'      type: number\n'+
'  sigma:\n'+
'      description: "sigma parameter"\n'+
'      type: number\n'+
'required: [r_cut, atom_type_1, atom_type_2, epsilon, sigma]\n'+''];
