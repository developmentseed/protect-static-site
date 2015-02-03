var env = require('node-env-file');
var express = require('express');
var protect = require('./lib/static-protect.js');
var Mkdocs = require('./lib/mkdocs.js');
var githubhook = require('githubhook');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({});

try {
  env(__dirname + '/.env');
}
catch(err) {
  console.log(err);
}

var REPO = process.env.REPO || false;

var mkdocs = new Mkdocs('master', __dirname, 'site', process.env.GITHUB_USER, process.env.GITHUB_PASS);

if (REPO) {
  mkdocs.build(REPO);
}

var github_hook = process.env.GITHUB_HOOK || '/github/callback';
var github_port = '3420';
var github = githubhook({path: github_hook, port: github_port});

github.on('push', function (repo, ref, data) {
  if (REPO === data['repository']['full_name'])
    mkdocs.build(data['repository']['full_name']);
});

github.listen();

var app = express();

app.post(github_hook, function(req, res) {
  proxy.web(req, res, {
    target: 'http://127.0.0.1:' + github_port
  });
});

var server = new protect(__dirname);
server.init(app);

app.listen(process.env.PORT || 3000);

console.log('Server started http://127.0.0.1:3000');

