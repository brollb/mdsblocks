'use strict';
var express = require('express');

var Server = function(port) {
    this.port = port || 8081;
    this.app = express();
    // Simple static web server
    this.app.set('views', __dirname);
    console.log('views base is '+__dirname);

    // Basic static web server
    this.app.use(express.static(__dirname));
};

Server.prototype.start = function(done) {
    this.server = this.app.listen(this.port, function() {
        var host = this.server.address().address,
            port = this.server.address().port;

        if (done) {
            done();
        }

        console.log('Blockly example server listening at http://'+host+':'+port);
    }.bind(this));
};

Server.prototype.close = function(done) {
    this.server.close(done);
};

module.exports = Server;
