/*globals Blockly*/
/*
 * Creating custom blocks in blockly
 */
'use strict';
Blockly.Blocks.example_block = {
    // The next function defines the look and feel of the block
    init: function() {
        this.setHelpUrl('');
        this.setColour(130);

        // shape stuff
        this.setOutput(true, 'Number');
        var input = this.appendValueInput('Input').setCheck('Number');  // Predicate --> value

        // "Commands" --> statement
        //this.setPreviousStatement(true, 'Number');  // Can we make our own types? I believe so
        this.setNextStatement(true);

        // Input Fields
        var testInput = new Blockly.FieldTextInput('MyTextField');
        input.appendField(testInput, 'NAME');

        // Blockly also supports dropdowns and color selectors
        // Also can 
        this.setInputsInline(true);

    }
};
