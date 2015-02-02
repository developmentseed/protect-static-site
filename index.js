var protect = require('./lib/static-protect.js');
var env = require('node-env-file');

env(__dirname + '/.env');

var server = new protect(__dirname)

server.start();
