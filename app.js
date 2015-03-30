'use strict';
var express = require('express'),
    app = express(),
    port = 8081;

// Simple static web server
app.set('views', __dirname);
console.log('views base is '+__dirname);

// Basic static web server
app.use(express.static(__dirname));

var server = app.listen(port, function() {
    var host = server.address().address,
        port = server.address().port;

    console.log('Blockly example server listening at http://'+host+':'+port);
});
