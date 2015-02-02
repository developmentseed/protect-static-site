var express = require('express');
var passport = require('passport');
var util = require('util');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var serverStatic = require('serve-static');
var spawn = require('child_process').spawn;
var ncp = require('ncp').ncp;
var async = require('async');
var path = require('path');
var GitHubStrategy = require('passport-github').Strategy;

function StaticProtect (root_folder) {

  this.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ""
  this.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
  this.SITE_URL = process.env.SITE_URL || "";
  this.DIST_FOLDER = process.env.DIST_FOLDER || "dist";

  this.ROOT_FOLDER = typeof root_folder !== 'undefined'
    ? root_folder
    : __dirname;

}

StaticProtect.prototype.init = function() {

  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  However, since in this app we do not
  //   have a database of user records, the complete GitHub profile is serialized
  //   and deserialized.
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  // Use the GitHubStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and GitHub
  //   profile), and invoke a callback with a user object.
  passport.use(new GitHubStrategy({
      clientID: this.GITHUB_CLIENT_ID,
      clientSecret: this.GITHUB_CLIENT_SECRET,
      callbackURL: this.SITE_URL + "/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {

        // To keep the example simple, the user's GitHub profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the GitHub account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  ));

  this.app = express();

  // configure Express
  this.app.set('views', __dirname + '/views');
  this.app.set('view engine', 'ejs');
  this.app.use(logger('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
  }));
  this.app.use(cookieParser());
  this.app.use(bodyParser.urlencoded({
    extended: true
  }));
  this.app.use(bodyParser.json());
  this.app.use(methodOverride());
  this.app.use(session({
      secret: 'keyboard cat',
      resave: true,
      saveUninitialized: true
  }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  this.app.use(passport.initialize());
  this.app.use(passport.session());

  this.app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

  this.app.get('/account', ensureAuthenticated, function(req, res){
    res.render('account', { user: req.user });
  });

  this.app.get('/login', function(req, res){
    res.render('login', { user: req.user });
  });

  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHubwill redirect the user
  //   back to this application at /auth/github/callback
  this.app.get('/auth/github',
    passport.authenticate('github'),
    function(req, res){
      // The request will be redirected to GitHub for authentication, so this
      // function will not be called.
  });

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  this.app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });

  this.app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  this.app.use(ensureAuthenticated);

  this.app.use(serverStatic(path.join(this.ROOT_FOLDER, this.DIST_FOLDER)));

  return this;

}


StaticProtect.prototype.start = function (port, address) {

  this.init();

  port = typeof port !== 'undefined'
    ? port
    : 3000;

  address = typeof address !== 'undefined'
    ? address
    : '127.0.0.1';

  this.app.listen(port);
  console.log('Server started http://' + address + ':' + port);

}

exports = module.exports = StaticProtect;

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
