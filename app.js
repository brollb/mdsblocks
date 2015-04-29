'use strict';
var Server = require('./Server'),
    app = new Server(8081);

app.start();
