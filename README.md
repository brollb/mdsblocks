# `Blockly-Concepts`
This contains my blockly-concepts integration for metamds

# Project structure:
    + concepts/
        + Block definitions
    + code/
        + Instances of simulations, etc
    + project.yaml

## To Do:
+ Write to `Github`
    + How should the projects be saved?
      + Should we save on a workspace-basis?
        + This might be the most straight forward
        + We need to figure out the workspace path...
          + The Github loader can store the path info from github on load
    + We should save a workspace at a time. Each workspace is one instantiated root block and creates a single yaml file

    + We should create a `MDSProject` object which has both a Github interface and a BlockCreator. When the `Save` button is clicked, it should save the projects to `Github`. 
        + The BlockCreator will need to keep track of the current projects.

    + Should each project be a namespace?

+ What should we do with multiple blocks?

+ Save all workspaces to `Github`

+ Tags for blocks
    + Test this with multiple blocks and tags

+ Text view of the blocks
    + diffs
    + class inheritance
    + class override

+ I think there is a bug in octokat
    + I think it is doing unauthenticated reads to github... (these are limited)

+ Load a block from a `yaml` concept file
    + `description` can simply be a tooltip
    + for each element in `properties`, we can create an input? ... 

    + How do we know the output of the concept? 

## Completed To Do Items:
+ Add names to blocks
    + DONE

+ Create a `github` loading module using `octokat`
    DONE

+ Create some customized `blockly` blocks --> DONE!
+ Load the customized blocks into the example environment --> DONE!
    + Can I add custom blocks on the fly? Yep!

+ Create instantiated blocks
    + I will need to record the primary project
    + Load just the instance blocks with this project
    + DONE

+ Generic Types
    + Int, Real, String (catch all)
        + Added support for number/non number... 
        + DONE

+ Create YAML from the blocks
    + Adding to python language
    + Create the code generation while creating the blocks?
    + DONE

+ Projects
    + Should persist
        + DONE


## Questions
+ How can I tell a block's output? That is, how do I tell if it should be a statement or a value?
