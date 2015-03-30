/*globals Blockly,yaml*/
/*
 * The MDSBlockCreator takes a concept JSON file and creates a blockly code block from it.
 */
(function(global) {
    'use strict';
    var count = 0;

    /**
     * MDSBlockCreator
     *
     * @constructor
     * @param {DOM Element} toolbox
     * @return {undefined}
     */
    var MDSBlockCreator = function(toolbox) {
        this.toolbox = toolbox;
    };

    MDSBlockCreator.prototype.createBlock = function(name, yamlContent, category) {
        var concept = yaml.load(yamlContent),
            id = 'block_'+(++count);

        // Create the block from the concept json
        Blockly.Blocks[id] = {
            init: function() {
                this.setTooltip(concept.description);

                // Make it a statement with connections to prior and subsequent blocks
                this.setPreviousStatement(true);
                this.setNextStatement(true);

                // For each of the "properties", create an input
                var properties = Object.keys(concept.properties),
                    displayName,
                    type,
                    input;

                for (var i = 0; i < properties.length; i++) {  // Order may be more intuitive

                    displayName = properties[i].replace(/_/g, ' ');
                    type = Utils.capitalize(concept.properties[properties[i]].type || '');

                    if (type.toLowerCase() === 'list') {
                        displayName += ':';
                        input = this.appendStatementInput(properties[i]);
                    } else {
                        input = this.appendValueInput(properties[i]);
                    }

                    // Set the acceptable types
                    input.setCheck(type)
                        // Pretty things up 
                        .appendField(displayName)
                        .setAlign(Blockly.ALIGN_RIGHT);

                        if (input.description) {
                            input.setTooltip(input.description);
                        }

                    // Add typechecking?
                    // TODO
                }

                // Handle the required input?
                // TODO

                // Set the output?
                // TODO

                // Set the color intelligently? Perhaps based on the output...
                // TODO

                this.setColour(Math.random()*360);
            }
        };

        // Add the block to the toolbox
        this._addBlock(id, category);
    };

    //MDSBlockCreator.prototype._addFieldToBlock = function(id, category)

    /**
     * Add a block with the given id to the toolbox.
     *
     * @param {String} id
     * @return {undefined}
     */
    MDSBlockCreator.prototype._addBlock = function(id, category) {
        var block = document.createElement('block');

        block.setAttribute('type', id);


        // Find the correct category using BFS
        var current = [this.toolbox],
            node,
            tag,
            next;

        while (current.length) {
            next = [];
            for (var i = current.length; i--;) {
                node = current[i];
                if (node.getAttribute('name') === category) {
                    return node.appendChild(block);
                } else {
                    // Filter the nodes as we add them to "next"
                    for (var j = node.childNodes.length; j--;) {
                        tag = (node.childNodes[j].tagName || '').toLowerCase();
                        if (tag === 'category' || tag === 'xml') {
                            next.push(node.childNodes[j]);
                        }
                    }
                }
            }
            current = next;
        }

        node.appendChild(block);
    };

    global.MDSBlockCreator = MDSBlockCreator;
})(this);
