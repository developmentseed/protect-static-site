var shell = require('./shellHelper');
var path = require('path');
var fs = require('fs');
var events = require('events');

var eventEmitter = new events.EventEmitter();

//private
function gitUrlGenerator(repo_path, username, password) {

  if (typeof username !== 'undefined' && typeof password !== 'undefined') {
    return 'https://' + username + ':' + password + '@github.com/' + repo_path + '.git';
  }
  else {
    return 'https://github.com/' + repo_path + '.git';
  }
}

function _build(branch, src, dst, git_folder, base_dir) {
  process.chdir(git_folder);
  shell.series([
    'git checkout ' + branch,
    'mkdocs build --clean',
    'rm -rf ' + dst,
    'cp -r ' + src + ' ' + dst,
  ], function(err){
    if (err) {
      console.log(err);
    }
    else {
      console.log('Clone and build of mkdocs repo completed successfully.');
    }
    process.chdir(base_dir);
  });
}

function _clone (git_dir, repo, user, pass) {

  if (fs.existsSync(git_dir)) {
    shell.series([
      'git -C ' + git_dir + ' pull origin master',
    ], function(err){
      if (err) {
        console.log(err);
      }
      else {
        console.log('Repo updated');
        eventEmitter.emit('cloned');
      }
    });
  }
  else {
    shell.series([
      'git clone ' + gitUrlGenerator(repo, user, pass) + ' ' + git_dir,
    ], function(err){
      if (err) {
        console.log(err);
      }
      else {
        console.log('Repo cloned');
        eventEmitter.emit('cloned');
      }
    });
  }
}

//public
function Mkdocs(branch, base_dir, build_dir, username, password) {
  var self = this;
  this.user = username;
  this.pass = password;

  this.base_dir = base_dir;
  this.git_folder = path.join(this.base_dir, 'github');
  this.src = path.join(this.git_folder, build_dir)
  this.dst = path.join(this.base_dir, 'site');

  eventEmitter.on('cloned', function () {
    _build(branch, self.src, self.dst, self.git_folder, self.base_dir);
  });
}

Mkdocs.prototype.build = function (repo) {
  _clone(this.git_folder, repo, this.user, this.pass);
}

exports = module.exports = Mkdocs;
