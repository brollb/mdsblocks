# Blockly-Concepts
This contains my blockly-concepts integration for metamds

## To Do:
+ Write to Github
+ Tags for blocks
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

## Questions
+ How can I tell a block's output? That is, how do I tell if it should be a statement or a value?
